import sqlite3 from 'sqlite3';
import path from 'path';

export class TestDatabase {
  private db: sqlite3.Database;

  constructor() {
    const testDbPath = path.join(__dirname, '..', '..', 'test-urls.db');
    this.db = new sqlite3.Database(testDbPath);
    this.initialize();
  }

  private initialize() {
    return new Promise<void>((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
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
        
        this.db.run('CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code)', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async insertUrl(shortCode: string, originalUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO urls (short_code, original_url) VALUES (?, ?)',
        [shortCode, originalUrl],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getUrl(shortCode: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM urls WHERE short_code = ?',
        [shortCode],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async getAllUrls(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM urls', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
