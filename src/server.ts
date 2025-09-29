import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors());
app.use(express.json());

// Security middleware
// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down after 50 requests in 15 minutes
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 50
  maxDelayMs: 20000, // max delay of 20 seconds
});

// Apply rate limiting to all requests
app.use(limiter);
app.use(speedLimiter);

// SQLite database setup
interface UrlEntry {
  id: number;
  short_code: string;
  original_url: string;
  created_at: string;
  click_count: number;
}

// Initialize SQLite database
const db = new sqlite3.Database('urls.db');

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      click_count INTEGER DEFAULT 0
    )
  `);
  
  // Create index for fast lookups
  db.run('CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code)');
});

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Only allow HTTP and HTTPS protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Helper function to check for suspicious URLs
function isSuspiciousUrl(url: string): boolean {
  const suspiciousPatterns = [
    /localhost/i,
    /127\.0\.0\.1/i,
    /0\.0\.0\.0/i,
    /::1/i,
    /file:/i,
    /ftp:/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(url));
}

// Helper function to validate URL length
function isValidUrlLength(url: string): boolean {
  return url.length >= 10 && url.length <= 2048; // Reasonable URL length limits
}

// Helper function to check for spam patterns
function containsSpamPatterns(url: string): boolean {
  const spamPatterns = [
    /bit\.ly/i,
    /tinyurl/i,
    /short\.link/i,
    /goo\.gl/i,
    /t\.co/i,
    /fb\.me/i,
    /ow\.ly/i,
    /is\.gd/i
  ];
  
  return spamPatterns.some(pattern => pattern.test(url));
}

// Helper function to generate short code
function generateShortCode(): string {
  return uuidv4().replace(/-/g, '').substring(0, 8);
}

// Helper function to get the correct protocol and host
function getBaseUrl(req: any): string {
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('host');
  
  // Use a shorter domain if available (you can set this in Railway environment variables)
  const shortDomain = process.env.SHORT_DOMAIN;
  if (shortDomain) {
    return `${protocol}://${shortDomain}`;
  }
  
  return `${protocol}://${host}`;
}

// Routes
app.post('/api/shorten', (req, res) => {
  const { url } = req.body;

  // Input validation
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (typeof url !== 'string') {
    return res.status(400).json({ error: 'URL must be a string' });
  }

  // Trim whitespace
  const cleanUrl = url.trim();

  if (!cleanUrl) {
    return res.status(400).json({ error: 'URL cannot be empty' });
  }

  // Validate URL format
  if (!isValidUrl(cleanUrl)) {
    return res.status(400).json({ error: 'Invalid URL format. Only HTTP and HTTPS URLs are allowed.' });
  }

  // Check URL length
  if (!isValidUrlLength(cleanUrl)) {
    return res.status(400).json({ error: 'URL length must be between 10 and 2048 characters.' });
  }

  // Check for suspicious URLs
  if (isSuspiciousUrl(cleanUrl)) {
    return res.status(400).json({ error: 'Suspicious URL detected. Local and file URLs are not allowed.' });
  }

  // Check for spam patterns (optional - you can remove this if you want to allow shortening of already shortened URLs)
  if (containsSpamPatterns(cleanUrl)) {
    return res.status(400).json({ error: 'URL appears to be already shortened. Please provide the original URL.' });
  }

  // Check if URL already exists
  db.get('SELECT * FROM urls WHERE original_url = ?', [cleanUrl], (err, row: UrlEntry) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (row) {
      return res.json({
        shortUrl: `${getBaseUrl(req)}/${row.short_code}`,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        clickCount: row.click_count
      });
    }

    // Create new short URL
    const shortCode = generateShortCode();
    
    // Insert into database
    db.run('INSERT INTO urls (short_code, original_url) VALUES (?, ?)', [shortCode, cleanUrl], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({
        shortUrl: `${getBaseUrl(req)}/${shortCode}`,
        originalUrl: cleanUrl,
        shortCode: shortCode,
        clickCount: 0
      });
    });
  });
});

app.get('/api/stats/:shortCode', (req, res) => {
  const { shortCode } = req.params;

  db.get('SELECT short_code, original_url, click_count, created_at FROM urls WHERE short_code = ?', [shortCode], (err, row: UrlEntry) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    res.json({
      originalUrl: row.original_url,
      shortCode: row.short_code,
      clickCount: row.click_count,
      createdAt: row.created_at
    });
  });
});

app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;

  db.get('SELECT * FROM urls WHERE short_code = ?', [shortCode], (err, row: UrlEntry) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal server error');
    }

    if (!row) {
      return res.status(404).send('Short URL not found');
    }

    // Increment click count
    db.run('UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?', [shortCode], (err) => {
      if (err) {
        console.error('Database error:', err);
      }
    });

    // Redirect to original URL
    res.redirect(row.original_url);
  });
});

// Serve a simple HTML page for the root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>URL Shortener</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          color: #333;
        }
        h1 {
          text-align: center;
          margin-bottom: 2rem;
          color: #333;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        input[type="url"] {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          box-sizing: border-box;
        }
        input[type="url"]:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          margin-top: 1rem;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .result {
          margin-top: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          display: none;
        }
        .error {
          color: #c33;
          background: #fee;
          border-left: 4px solid #c33;
        }
        .success {
          color: #28a745;
          background: #d4edda;
          border-left: 4px solid #28a745;
        }
        .short-url {
          font-family: 'Courier New', monospace;
          font-weight: 600;
          color: #667eea;
          word-break: break-all;
        }
        .features {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .features h3 {
          margin-bottom: 1rem;
          color: #333;
        }
        .features ul {
          list-style: none;
          padding: 0;
        }
        .features li {
          padding: 0.5rem 0;
          color: #666;
        }
        .captcha-container {
          background: #f8f9fa;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }
        .captcha-challenge {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .captcha-challenge span {
          font-weight: 600;
          color: #333;
          min-width: 120px;
        }
        .captcha-challenge input {
          flex: 1;
          min-width: 100px;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔗 URL Shortener</h1>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">Transform long URLs into short, shareable links</p>
        
        <form id="urlForm">
          <div class="form-group">
            <input type="url" id="urlInput" placeholder="Enter your long URL here..." required>
          </div>
          <div class="form-group">
            <div class="captcha-container">
              <div class="captcha-challenge">
                <span id="captchaQuestion">What is 3 + 4?</span>
                <input type="text" id="captchaAnswer" placeholder="Your answer" required>
              </div>
            </div>
          </div>
          <button type="submit">Shorten URL</button>
        </form>
        
        <div id="result" class="result"></div>
        
        <div class="features">
          <h3>Features</h3>
          <ul>
            <li>✨ Free and fast URL shortening</li>
            <li>📊 Click tracking and analytics</li>
            <li>🔒 Secure and reliable</li>
            <li>📱 Mobile-friendly interface</li>
            <li>🔗 HTTPS secure links</li>
          </ul>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
            <strong>Note:</strong> For shorter URLs, consider using a custom domain. 
            Set the <code>SHORT_DOMAIN</code> environment variable in Railway.
          </p>
        </div>
      </div>

      <script>
        // Simple CAPTCHA system
        let captchaAnswer = 0;
        
        function generateCaptcha() {
          const num1 = Math.floor(Math.random() * 10) + 1;
          const num2 = Math.floor(Math.random() * 10) + 1;
          const operation = Math.random() > 0.5 ? '+' : '-';
          
          let question, answer;
          if (operation === '+') {
            question = \`What is \${num1} + \${num2}?\`;
            answer = num1 + num2;
          } else {
            question = \`What is \${num1} - \${num2}?\`;
            answer = num1 - num2;
          }
          
          document.getElementById('captchaQuestion').textContent = question;
          captchaAnswer = answer;
        }
        
        // Generate initial CAPTCHA
        generateCaptcha();
        
        document.getElementById('urlForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const url = document.getElementById('urlInput').value;
          const captchaInput = document.getElementById('captchaAnswer').value;
          const resultDiv = document.getElementById('result');
          
          // Validate CAPTCHA
          if (parseInt(captchaInput) !== captchaAnswer) {
            resultDiv.innerHTML = \`
              <div class="error">
                <strong>CAPTCHA Error:</strong> Incorrect answer. Please try again.
              </div>
            \`;
            resultDiv.style.display = 'block';
            generateCaptcha(); // Generate new CAPTCHA
            document.getElementById('captchaAnswer').value = '';
            return;
          }
          
          try {
            const response = await fetch('/api/shorten', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || 'Failed to shorten URL');
            }
            
            resultDiv.innerHTML = \`
              <div class="success">
                <h3>Your shortened URL:</h3>
                <div class="short-url">\${data.shortUrl}</div>
                <p><strong>Original URL:</strong> \${data.originalUrl}</p>
                <p><strong>Clicks:</strong> \${data.clickCount}</p>
                <button onclick="navigator.clipboard.writeText('\${data.shortUrl}')" style="margin-top: 1rem; background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">📋 Copy</button>
              </div>
            \`;
            resultDiv.style.display = 'block';
            
            // Generate new CAPTCHA for next use
            generateCaptcha();
            document.getElementById('captchaAnswer').value = '';
          } catch (error) {
            resultDiv.innerHTML = \`
              <div class="error">
                <strong>Error:</strong> \${error.message}
              </div>
            \`;
            resultDiv.style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Handle other routes that might be looking for the React app
app.get('*', (req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - URL Shortener</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
          text-align: center;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          color: #333;
        }
        h1 { color: #333; }
        a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/">← Back to URL Shortener</a></p>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
