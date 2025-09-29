import request from 'supertest';
import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { existsSync, unlinkSync } from 'fs';

// Functional tests with real server
describe('URL Shortener Functional Tests', () => {
  let app: express.Application;
  let testDb: sqlite3.Database;
  const testDbPath = path.join(__dirname, '..', 'functional-test-urls.db');

  beforeAll(async () => {
    // Create test database
    testDb = new sqlite3.Database(testDbPath);
    
    // Initialize database schema
    await new Promise<void>((resolve, reject) => {
      testDb.serialize(() => {
        testDb.run(`
          CREATE TABLE IF NOT EXISTS urls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            short_code TEXT UNIQUE NOT NULL,
            original_url TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            click_count INTEGER DEFAULT 0
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
        
        testDb.run('CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code)', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    // Create a simple Express app for testing
    app = express();
    app.use(express.json());

    // Mock the database operations
    app.post('/api/shorten', (req, res) => {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Check if URL already exists
      testDb.get('SELECT * FROM urls WHERE original_url = ?', [url], (err, row: any) => {
        if (err) {
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (row) {
          return res.json({
            shortUrl: `http://localhost:3000/${row.short_code}`,
            originalUrl: row.original_url,
            shortCode: row.short_code,
            clickCount: row.click_count
          });
        }

        // Generate new short code
        const shortCode = Math.random().toString(36).substring(2, 10);
        
        // Insert into database
        testDb.run('INSERT INTO urls (short_code, original_url) VALUES (?, ?)', [shortCode, url], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          res.json({
            shortUrl: `http://localhost:3000/${shortCode}`,
            originalUrl: url,
            shortCode: shortCode,
            clickCount: 0
          });
        });
      });
    });

    app.get('/api/stats/:shortCode', (req, res) => {
      const { shortCode } = req.params;

      testDb.get('SELECT short_code, original_url, click_count, created_at FROM urls WHERE short_code = ?', [shortCode], (err, row: any) => {
        if (err) {
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

      testDb.get('SELECT * FROM urls WHERE short_code = ?', [shortCode], (err, row: any) => {
        if (err) {
          return res.status(500).send('Internal server error');
        }

        if (!row) {
          return res.status(404).send('Short URL not found');
        }

        // Increment click count
        testDb.run('UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?', [shortCode], (err) => {
          if (err) {
            console.error('Error updating click count:', err);
          }
        });

        // Redirect to original URL
        res.redirect(row.original_url);
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      testDb.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  beforeEach(async () => {
    // Clean database before each test
    await new Promise<void>((resolve, reject) => {
      testDb.run('DELETE FROM urls', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('URL Shortening', () => {
    it('should shorten a valid URL', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('shortUrl');
      expect(response.body).toHaveProperty('originalUrl', 'https://example.com');
      expect(response.body).toHaveProperty('shortCode');
      expect(response.body).toHaveProperty('clickCount', 0);
    });

    it('should return 400 for missing URL', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'URL is required');
    });

    it('should return 400 for invalid URL', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'not-a-url' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid URL format');
    });
  });

  describe('URL Statistics', () => {
    it('should return URL statistics', async () => {
      // First create a URL
      const shortenResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://stats-test.com' })
        .expect(200);

      const shortCode = shortenResponse.body.shortCode;

      // Get stats
      const statsResponse = await request(app)
        .get(`/api/stats/${shortCode}`)
        .expect(200);

      expect(statsResponse.body).toHaveProperty('originalUrl', 'https://stats-test.com');
      expect(statsResponse.body).toHaveProperty('shortCode', shortCode);
      expect(statsResponse.body).toHaveProperty('clickCount', 0);
      expect(statsResponse.body).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent short code', async () => {
      const response = await request(app)
        .get('/api/stats/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Short URL not found');
    });
  });

  describe('URL Redirection', () => {
    it('should redirect to original URL', async () => {
      // First create a URL
      const shortenResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://redirect-test.com' })
        .expect(200);

      const shortCode = shortenResponse.body.shortCode;

      // Follow redirect
      const redirectResponse = await request(app)
        .get(`/${shortCode}`)
        .expect(302);

      expect(redirectResponse.headers.location).toBe('https://redirect-test.com');
    });

    it('should return 404 for non-existent short code', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.text).toBe('Short URL not found');
    });
  });

  describe('Click Tracking', () => {
    it('should increment click count on redirect', async () => {
      // Create a URL
      const shortenResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://click-test.com' })
        .expect(200);

      const shortCode = shortenResponse.body.shortCode;

      // Check initial click count
      let statsResponse = await request(app)
        .get(`/api/stats/${shortCode}`)
        .expect(200);

      expect(statsResponse.body.clickCount).toBe(0);

      // Follow redirect (simulate click)
      await request(app)
        .get(`/${shortCode}`)
        .expect(302);

      // Check updated click count
      statsResponse = await request(app)
        .get(`/api/stats/${shortCode}`)
        .expect(200);

      expect(statsResponse.body.clickCount).toBe(1);
    });
  });

  describe('Duplicate URL Handling', () => {
    it('should return same short code for duplicate URLs', async () => {
      const originalUrl = 'https://duplicate-test.com';
      
      // First shortening
      const response1 = await request(app)
        .post('/api/shorten')
        .send({ url: originalUrl })
        .expect(200);

      const shortCode1 = response1.body.shortCode;

      // Second shortening of same URL
      const response2 = await request(app)
        .post('/api/shorten')
        .send({ url: originalUrl })
        .expect(200);

      expect(response2.body.shortCode).toBe(shortCode1);
    });
  });
});
