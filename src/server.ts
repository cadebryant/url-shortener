import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { nanoid } from 'nanoid';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

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
  return nanoid(8);
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

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
