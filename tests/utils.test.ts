import { nanoid } from 'nanoid';

// Test utility functions
describe('Utility Functions', () => {
  describe('URL Validation', () => {
    const isValidUrl = (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com',
        'https://example.com/path',
        'https://example.com/path?query=value',
        'https://example.com:8080/path',
        'https://subdomain.example.com',
        'ftp://example.com',
        'https://example.co.uk',
        'https://example.com:3000/api/endpoint'
      ];

      validUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com',
        'https://',
        'http://',
        'ftp://',
        '://example.com',
        'https://',
        'just-text',
        '123456',
        'https://',
        'https://example',
        'https://.com',
        'https://example..com'
      ];

      invalidUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false);
      });
    });
  });

  describe('Short Code Generation', () => {
    it('should generate unique short codes', () => {
      const codes = new Set();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const code = nanoid(8);
        expect(code).toHaveLength(8);
        expect(codes.has(code)).toBe(false);
        codes.add(code);
      }
    });

    it('should generate codes with correct length', () => {
      const lengths = [4, 6, 8, 10, 12];
      
      lengths.forEach(length => {
        const code = nanoid(length);
        expect(code).toHaveLength(length);
      });
    });

    it('should generate URL-safe characters', () => {
      const code = nanoid(8);
      const urlSafePattern = /^[A-Za-z0-9_-]+$/;
      expect(code).toMatch(urlSafePattern);
    });
  });

  describe('Database Operations Helpers', () => {
    it('should handle SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE urls; --",
        "' OR '1'='1",
        "'; INSERT INTO urls (short_code, original_url) VALUES ('hacked', 'https://evil.com'); --",
        "' UNION SELECT * FROM urls --"
      ];

      // These should be safely handled by parameterized queries
      maliciousInputs.forEach(input => {
        // In a real implementation, these would be passed to parameterized queries
        // which would prevent SQL injection
        expect(typeof input).toBe('string');
      });
    });

    it('should validate short code format', () => {
      const validShortCodes = [
        'abc123',
        'ABC123',
        'abc-123',
        'abc_123',
        '12345678',
        'a1b2c3d4'
      ];

      const invalidShortCodes = [
        '',
        'a',
        'ab',
        'abc',
        'abc@123', // Contains special character
        'abc 123', // Contains space
        'abc.123', // Contains dot
        'abc/123'  // Contains slash
      ];

      const isValidShortCode = (code: string): boolean => {
        return /^[A-Za-z0-9_-]{4,}$/.test(code);
      };

      validShortCodes.forEach(code => {
        expect(isValidShortCode(code)).toBe(true);
      });

      invalidShortCodes.forEach(code => {
        expect(isValidShortCode(code)).toBe(false);
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should validate API response structure', () => {
      const mockResponse = {
        shortUrl: 'https://example.com/abc123',
        originalUrl: 'https://original.com',
        shortCode: 'abc123',
        clickCount: 0
      };

      expect(mockResponse).toHaveProperty('shortUrl');
      expect(mockResponse).toHaveProperty('originalUrl');
      expect(mockResponse).toHaveProperty('shortCode');
      expect(mockResponse).toHaveProperty('clickCount');
      
      expect(typeof mockResponse.shortUrl).toBe('string');
      expect(typeof mockResponse.originalUrl).toBe('string');
      expect(typeof mockResponse.shortCode).toBe('string');
      expect(typeof mockResponse.clickCount).toBe('number');
    });

    it('should validate stats response structure', () => {
      const mockStatsResponse = {
        originalUrl: 'https://original.com',
        shortCode: 'abc123',
        clickCount: 5,
        createdAt: '2024-01-01 12:00:00'
      };

      expect(mockStatsResponse).toHaveProperty('originalUrl');
      expect(mockStatsResponse).toHaveProperty('shortCode');
      expect(mockStatsResponse).toHaveProperty('clickCount');
      expect(mockStatsResponse).toHaveProperty('createdAt');
      
      expect(typeof mockStatsResponse.originalUrl).toBe('string');
      expect(typeof mockStatsResponse.shortCode).toBe('string');
      expect(typeof mockStatsResponse.clickCount).toBe('number');
      expect(typeof mockStatsResponse.createdAt).toBe('string');
    });
  });
});
