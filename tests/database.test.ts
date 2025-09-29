import { TestDatabase } from './utils/testDatabase';
import path from 'path';
import { existsSync, unlinkSync } from 'fs';

describe('Database Operations', () => {
  let testDb: TestDatabase;
  const testDbPath = path.join(__dirname, '..', 'test-urls.db');

  beforeAll(async () => {
    testDb = new TestDatabase();
  });

  afterAll(async () => {
    await testDb.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  beforeEach(async () => {
    // Clean up database before each test
    const db = testDb as any;
    await new Promise<void>((resolve, reject) => {
      db.db.run('DELETE FROM urls', (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('URL Insertion', () => {
    it('should insert a new URL successfully', async () => {
      const shortCode = 'test123';
      const originalUrl = 'https://example.com';

      await testDb.insertUrl(shortCode, originalUrl);

      const result = await testDb.getUrl(shortCode);
      expect(result).toBeDefined();
      expect(result.short_code).toBe(shortCode);
      expect(result.original_url).toBe(originalUrl);
      expect(result.click_count).toBe(0);
    });

    it('should handle duplicate short codes', async () => {
      const shortCode = 'duplicate';
      const url1 = 'https://example1.com';
      const url2 = 'https://example2.com';

      await testDb.insertUrl(shortCode, url1);
      
      await expect(testDb.insertUrl(shortCode, url2)).rejects.toThrow();
    });
  });

  describe('URL Retrieval', () => {
    it('should retrieve URL by short code', async () => {
      const shortCode = 'retrieve123';
      const originalUrl = 'https://retrieve.com';

      await testDb.insertUrl(shortCode, originalUrl);
      const result = await testDb.getUrl(shortCode);

      expect(result).toBeDefined();
      expect(result.short_code).toBe(shortCode);
      expect(result.original_url).toBe(originalUrl);
    });

    it('should return undefined for non-existent short code', async () => {
      const result = await testDb.getUrl('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('URL Listing', () => {
    it('should retrieve all URLs', async () => {
      const urls = [
        { shortCode: 'url1', originalUrl: 'https://url1.com' },
        { shortCode: 'url2', originalUrl: 'https://url2.com' },
        { shortCode: 'url3', originalUrl: 'https://url3.com' }
      ];

      for (const url of urls) {
        await testDb.insertUrl(url.shortCode, url.originalUrl);
      }

      const allUrls = await testDb.getAllUrls();
      expect(allUrls).toHaveLength(3);
      
      const shortCodes = allUrls.map((url: any) => url.short_code);
      expect(shortCodes).toContain('url1');
      expect(shortCodes).toContain('url2');
      expect(shortCodes).toContain('url3');
    });

    it('should return empty array when no URLs exist', async () => {
      const allUrls = await testDb.getAllUrls();
      expect(allUrls).toHaveLength(0);
    });
  });

  describe('Database Schema', () => {
    it('should have correct table structure', async () => {
      const db = testDb as any;
      const tableInfo = await new Promise<any[]>((resolve, reject) => {
        db.db.all("PRAGMA table_info(urls)", (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      expect(tableInfo).toHaveLength(5);
      
      const columns = tableInfo.map((col: any) => col.name);
      expect(columns).toContain('id');
      expect(columns).toContain('short_code');
      expect(columns).toContain('original_url');
      expect(columns).toContain('created_at');
      expect(columns).toContain('click_count');
    });

    it('should have proper indexes', async () => {
      const db = testDb as any;
      const indexes = await new Promise<any[]>((resolve, reject) => {
        db.db.all("PRAGMA index_list(urls)", (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const indexNames = indexes.map((idx: any) => idx.name);
      expect(indexNames).toContain('idx_short_code');
    });
  });
});
