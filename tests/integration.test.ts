import request from 'supertest';
import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { existsSync, unlinkSync } from 'fs';

// Integration tests with real database
describe('URL Shortener Integration Tests', () => {
  let app: express.Application;
  let testDb: sqlite3.Database;
  const testDbPath = path.join(__dirname, '..', 'integration-test-urls.db');

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

    // Mock the database in the server
    jest.doMock('sqlite3', () => ({
      Database: jest.fn(() => testDb)
    }));

    // Import server after mocking
    const serverModule = require('../src/server');
    app = serverModule.default || serverModule;
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

  describe('Complete URL Shortening Flow', () => {
    it('should handle complete URL shortening and redirect flow', async () => {
      const originalUrl = 'https://integration-test.com';
      
      // Step 1: Shorten URL
      const shortenResponse = await request(app)
        .post('/api/shorten')
        .send({ url: originalUrl })
        .expect(200);

      expect(shortenResponse.body).toHaveProperty('shortUrl');
      expect(shortenResponse.body).toHaveProperty('originalUrl', originalUrl);
      expect(shortenResponse.body).toHaveProperty('shortCode');
      expect(shortenResponse.body).toHaveProperty('clickCount', 0);

      const shortCode = shortenResponse.body.shortCode;

      // Step 2: Check stats before redirect
      const statsResponse1 = await request(app)
        .get(`/api/stats/${shortCode}`)
        .expect(200);

      expect(statsResponse1.body.clickCount).toBe(0);

      // Step 3: Follow redirect (simulate click)
      const redirectResponse = await request(app)
        .get(`/${shortCode}`)
        .expect(302);

      expect(redirectResponse.headers.location).toBe(originalUrl);

      // Step 4: Check stats after redirect
      const statsResponse2 = await request(app)
        .get(`/api/stats/${shortCode}`)
        .expect(200);

      expect(statsResponse2.body.clickCount).toBe(1);
    });

    it('should handle multiple redirects and increment click count', async () => {
      const originalUrl = 'https://multi-click-test.com';
      
      // Shorten URL
      const shortenResponse = await request(app)
        .post('/api/shorten')
        .send({ url: originalUrl })
        .expect(200);

      const shortCode = shortenResponse.body.shortCode;

      // Simulate multiple clicks
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get(`/${shortCode}`)
          .expect(302);
      }

      // Check final click count
      const statsResponse = await request(app)
        .get(`/api/stats/${shortCode}`)
        .expect(200);

      expect(statsResponse.body.clickCount).toBe(5);
    });

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
      expect(response2.body.clickCount).toBe(0); // Should return existing entry
    });

    it('should handle database persistence across operations', async () => {
      const urls = [
        'https://persistence-test1.com',
        'https://persistence-test2.com',
        'https://persistence-test3.com'
      ];

      const shortCodes: string[] = [];

      // Create multiple URLs
      for (const url of urls) {
        const response = await request(app)
          .post('/api/shorten')
          .send({ url })
          .expect(200);
        
        shortCodes.push(response.body.shortCode);
      }

      // Verify all URLs exist and can be accessed
      for (const shortCode of shortCodes) {
        const statsResponse = await request(app)
          .get(`/api/stats/${shortCode}`)
          .expect(200);

        expect(statsResponse.body).toHaveProperty('originalUrl');
        expect(statsResponse.body).toHaveProperty('shortCode', shortCode);
        expect(statsResponse.body).toHaveProperty('clickCount', 0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      // Test with invalid JSON
      await request(app)
        .post('/api/shorten')
        .send('invalid json')
        .expect(400);

      // Test with missing URL
      await request(app)
        .post('/api/shorten')
        .send({})
        .expect(400);

      // Test with invalid URL format
      await request(app)
        .post('/api/shorten')
        .send({ url: 'not-a-url' })
        .expect(400);
    });

    it('should handle non-existent short codes', async () => {
      await request(app)
        .get('/api/stats/nonexistent')
        .expect(404);

      await request(app)
        .get('/nonexistent')
        .expect(404);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .post('/api/shorten')
          .send({ url: `https://concurrent-test-${i}.com` })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('shortCode');
      });

      // Verify all URLs were created
      const allUrls = await new Promise<any[]>((resolve, reject) => {
        testDb.all('SELECT * FROM urls', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      expect(allUrls).toHaveLength(10);
    });
  });
});
