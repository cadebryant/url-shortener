import request from 'supertest';
import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';

// Mock the database for testing
jest.mock('sqlite3');

describe('URL Shortener API', () => {
  let app: express.Application;
  let mockDb: any;

  beforeAll(() => {
    // Create a mock database
    mockDb = {
      get: jest.fn(),
      run: jest.fn(),
      serialize: jest.fn((callback) => callback()),
    };

    (sqlite3.Database as jest.Mock).mockImplementation(() => mockDb);

    // Import the server after mocking
    const serverModule = require('../src/server');
    app = serverModule.default || serverModule;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/shorten', () => {
    it('should shorten a valid URL', async () => {
      const testUrl = 'https://example.com';
      
      // Mock database responses
      mockDb.get.mockImplementation((query, params, callback) => {
        if (query.includes('original_url')) {
          callback(null, null); // No existing URL
        }
      });

      mockDb.run.mockImplementation((query, params, callback) => {
        if (query.includes('INSERT')) {
          callback(null, { lastID: 1 });
        }
      });

      const response = await request(app)
        .post('/api/shorten')
        .send({ url: testUrl })
        .expect(200);

      expect(response.body).toHaveProperty('shortUrl');
      expect(response.body).toHaveProperty('originalUrl', testUrl);
      expect(response.body).toHaveProperty('shortCode');
      expect(response.body).toHaveProperty('clickCount', 0);
    });

    it('should return existing URL if already shortened', async () => {
      const testUrl = 'https://example.com';
      const existingEntry = {
        short_code: 'abc123',
        original_url: testUrl,
        click_count: 5
      };

      mockDb.get.mockImplementation((query, params, callback) => {
        if (query.includes('original_url')) {
          callback(null, existingEntry);
        }
      });

      const response = await request(app)
        .post('/api/shorten')
        .send({ url: testUrl })
        .expect(200);

      expect(response.body.shortCode).toBe('abc123');
      expect(response.body.clickCount).toBe(5);
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
        .send({ url: 'not-a-valid-url' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid URL format');
    });

    it('should handle database errors', async () => {
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('GET /api/stats/:shortCode', () => {
    it('should return URL statistics', async () => {
      const shortCode = 'abc123';
      const mockEntry = {
        short_code: shortCode,
        original_url: 'https://example.com',
        click_count: 10,
        created_at: '2024-01-01 12:00:00'
      };

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockEntry);
      });

      const response = await request(app)
        .get(`/api/stats/${shortCode}`)
        .expect(200);

      expect(response.body).toHaveProperty('originalUrl', 'https://example.com');
      expect(response.body).toHaveProperty('shortCode', shortCode);
      expect(response.body).toHaveProperty('clickCount', 10);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent short code', async () => {
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      const response = await request(app)
        .get('/api/stats/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Short URL not found');
    });

    it('should handle database errors in stats', async () => {
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .get('/api/stats/abc123')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('GET /:shortCode', () => {
    it('should redirect to original URL', async () => {
      const shortCode = 'abc123';
      const originalUrl = 'https://example.com';
      const mockEntry = {
        short_code: shortCode,
        original_url: originalUrl,
        click_count: 5
      };

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockEntry);
      });

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(null);
      });

      const response = await request(app)
        .get(`/${shortCode}`)
        .expect(302);

      expect(response.headers.location).toBe(originalUrl);
    });

    it('should return 404 for non-existent short code', async () => {
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.text).toBe('Short URL not found');
    });

    it('should handle database errors in redirect', async () => {
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .get('/abc123')
        .expect(500);

      expect(response.text).toBe('Internal server error');
    });
  });

  describe('GET / (React app)', () => {
    it('should serve React app for root route', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });
  });
});
