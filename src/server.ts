import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { nanoid } from 'nanoid';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// In-memory storage (in production, use a database)
interface UrlEntry {
  id: string;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clickCount: number;
}

const urlDatabase: Map<string, UrlEntry> = new Map();

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
  const existingEntry = Array.from(urlDatabase.values()).find(
    entry => entry.originalUrl === url
  );

  if (existingEntry) {
    return res.json({
      shortUrl: `${req.protocol}://${req.get('host')}/${existingEntry.shortCode}`,
      originalUrl: existingEntry.originalUrl,
      shortCode: existingEntry.shortCode,
      clickCount: existingEntry.clickCount
    });
  }

  // Create new short URL
  const shortCode = generateShortCode();
  const urlEntry: UrlEntry = {
    id: nanoid(),
    originalUrl: url,
    shortCode,
    createdAt: new Date(),
    clickCount: 0
  };

  urlDatabase.set(shortCode, urlEntry);

  res.json({
    shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`,
    originalUrl: urlEntry.originalUrl,
    shortCode: urlEntry.shortCode,
    clickCount: urlEntry.clickCount
  });
});

app.get('/api/stats/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const entry = urlDatabase.get(shortCode);

  if (!entry) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  res.json({
    originalUrl: entry.originalUrl,
    shortCode: entry.shortCode,
    clickCount: entry.clickCount,
    createdAt: entry.createdAt
  });
});

app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const entry = urlDatabase.get(shortCode);

  if (!entry) {
    return res.status(404).send('Short URL not found');
  }

  // Increment click count
  entry.clickCount++;
  urlDatabase.set(shortCode, entry);

  // Redirect to original URL
  res.redirect(entry.originalUrl);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
