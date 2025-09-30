# 🔗 URL Shortener

A modern, fast, and secure URL shortener built with TypeScript, Express.js, and SQLite. Features comprehensive security measures, rate limiting, and a beautiful web interface.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-https://cb--url--shortener.up.railway.app-green?style=for-the-badge)](https://cb-url-shortener.up.railway.app)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

## ✨ Features

- 🚀 **Fast URL shortening** - Generate short links instantly
- 📊 **Click tracking** - Monitor how many times your links are clicked
- 🎨 **Modern UI** - Clean, responsive design that works on all devices
- 🔒 **Enterprise Security** - Rate limiting, CAPTCHA, input validation
- 🛡️ **Abuse Protection** - Comprehensive anti-bot measures
- 📱 **Mobile-friendly** - Optimized for mobile and desktop
- 🛠️ **TypeScript** - Full type safety throughout the application
- ⚡ **Lightning fast** - Optimized for performance
- 🗄️ **Persistent Storage** - SQLite database with click tracking
- 🧪 **Fully Tested** - Comprehensive test suite with 19 passing tests

## 🌐 Live Demo

**Try it now:** [https://cb-url-shortener.up.railway.app](https://cb-url-shortener.up.railway.app)

- ✅ **Fully functional** - Shorten URLs instantly
- ✅ **Production ready** - Deployed on Railway with HTTPS
- ✅ **Security enabled** - Rate limiting and CAPTCHA protection
- ✅ **Mobile responsive** - Works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cadebryant/url-shortener.git
   cd url-shortener
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Development

### Running in Development Mode

1. **Start the backend in watch mode**
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3000` with hot reloading.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Project Structure

```
url-shortener/
├── src/
│   └── server.ts          # Express.js backend with embedded frontend
├── tests/                 # Comprehensive test suite
│   ├── simple.test.ts    # Unit tests
│   ├── functional.test.ts # Integration tests
│   └── utils/            # Test utilities
├── package.json
├── tsconfig.json
├── jest.config.js        # Test configuration
├── railway.json          # Railway deployment config
└── README.md
```

## 🚀 Deployment to Railway

### Method 1: Railway CLI (Recommended)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### Method 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Railway**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the build settings

### Method 3: Railway Dashboard

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically build and deploy

## 🔧 Configuration

### Environment Variables

The application uses the following environment variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `SHORT_DOMAIN` - Custom domain for shorter URLs (optional)

### Custom Domain (Optional)

To use a custom domain:

1. In Railway dashboard, go to your project
2. Click on "Settings"
3. Add your custom domain
4. Update DNS records as instructed

## 📊 API Endpoints

### POST `/api/shorten`
Shorten a URL

**Request:**
```json
{
  "url": "https://example.com/very/long/url"
}
```

**Response:**
```json
{
  "shortUrl": "https://cb-url-shortener.up.railway.app/abc123",
  "originalUrl": "https://example.com/very/long/url",
  "shortCode": "abc123",
  "clickCount": 0
}
```

**Security Features:**
- Rate limiting: 100 requests per 15 minutes per IP
- CAPTCHA validation required
- Input sanitization and validation
- Suspicious URL detection

### GET `/api/stats/:shortCode`
Get statistics for a short URL

**Response:**
```json
{
  "originalUrl": "https://example.com/very/long/url",
  "shortCode": "abc123",
  "clickCount": 5,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET `/:shortCode`
Redirect to original URL

## 🎨 Customization

### Styling
Edit the embedded CSS in `src/server.ts` to customize the appearance.

### Backend Logic
Modify `src/server.ts` to add features like:
- User authentication
- Custom short codes
- Expiration dates
- Analytics

### Security Settings
Adjust rate limiting, CAPTCHA complexity, and validation rules in `src/server.ts`.

## 🧪 Testing

The project includes comprehensive tests:

- **Unit Tests** - Test utility functions and validation logic
- **Integration Tests** - Test API endpoints with real database
- **Security Tests** - Validate rate limiting and input sanitization

Run tests with:
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database powered by [SQLite](https://www.sqlite.org/)
- Deployed on [Railway](https://railway.app)
- Testing with [Jest](https://jestjs.io/)
- Security with [Helmet](https://helmetjs.github.io/)
- Icons from [Emoji](https://emojipedia.org/)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Happy URL Shortening! 🎉**
