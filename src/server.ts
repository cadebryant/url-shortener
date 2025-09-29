import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

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
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper function to generate short code
function generateShortCode(): string {
  return uuidv4().replace(/-/g, '').substring(0, 8);
}

// Routes
app.post('/api/shorten', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Check if URL already exists
  db.get('SELECT * FROM urls WHERE original_url = ?', [url], (err, row: UrlEntry) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (row) {
      return res.json({
        shortUrl: `${req.protocol}://${req.get('host')}/${row.short_code}`,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        clickCount: row.click_count
      });
    }

    // Create new short URL
    const shortCode = generateShortCode();
    
    // Insert into database
    db.run('INSERT INTO urls (short_code, original_url) VALUES (?, ?)', [shortCode, url], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({
        shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`,
        originalUrl: url,
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
          </ul>
        </div>
      </div>

      <script>
        document.getElementById('urlForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const url = document.getElementById('urlInput').value;
          const resultDiv = document.getElementById('result');
          
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
