# 🔗 URL Shortener

A modern, fast, and simple URL shortener built with TypeScript, React, and Express.js. Perfect for personal use or as a portfolio project.

![URL Shortener](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

## ✨ Features

- 🚀 **Fast URL shortening** - Generate short links instantly
- 📊 **Click tracking** - Monitor how many times your links are clicked
- 🎨 **Modern UI** - Clean, responsive design that works on all devices
- 🔒 **Secure** - Built with security best practices
- 📱 **Mobile-friendly** - Optimized for mobile and desktop
- 🛠️ **TypeScript** - Full type safety throughout the application
- ⚡ **Lightning fast** - Optimized for performance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd url-shortener
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client
   npm install
   cd ..
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

2. **In another terminal, start the React development server**
   ```bash
   npm run client
   ```

The backend will run on `http://localhost:3000` and the React dev server on `http://localhost:3001`.

### Project Structure

```
url-shortener/
├── src/
│   └── server.ts          # Express.js backend
├── client/                # React frontend
│   ├── src/
│   │   ├── App.tsx       # Main React component
│   │   └── App.css       # Styles
│   └── public/
├── package.json
├── tsconfig.json
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
  "shortUrl": "https://yourdomain.com/abc123",
  "originalUrl": "https://example.com/very/long/url",
  "shortCode": "abc123",
  "clickCount": 0
}
```

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
Edit `client/src/App.css` to customize the appearance.

### Backend Logic
Modify `src/server.ts` to add features like:
- User authentication
- Custom short codes
- Expiration dates
- Analytics

### Database Integration
Replace the in-memory storage with a database:

```typescript
// Example with MongoDB
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('urlshortener');
const urls = db.collection('urls');
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
- Frontend powered by [React](https://reactjs.org/)
- Deployed on [Railway](https://railway.app)
- Icons from [Emoji](https://emojipedia.org/)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Happy URL Shortening! 🎉**
