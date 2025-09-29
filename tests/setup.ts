// Test setup file
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

// Clean up test database before each test
beforeEach(() => {
  const testDbPath = path.join(__dirname, '..', 'test-urls.db');
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
});

// Clean up test database after all tests
afterAll(() => {
  const testDbPath = path.join(__dirname, '..', 'test-urls.db');
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
});
