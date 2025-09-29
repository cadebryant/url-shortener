# 🚀 Deployment Guide

This guide will help you deploy your URL shortener to Railway and add it to your GitHub profile.

## 📋 Prerequisites

- GitHub account
- Railway account (free tier available)
- Git installed on your machine

## 🔧 Step-by-Step Deployment

### 1. Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: URL shortener with TypeScript"

# Create repository on GitHub and push
git remote add origin https://github.com/yourusername/url-shortener.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Railway

#### Option A: Railway CLI (Fastest)

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

4. **Get your domain**
   ```bash
   railway domain
   ```

#### Option B: Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `url-shortener` repository
5. Railway will automatically detect the build settings
6. Wait for deployment to complete
7. Click on your project to get the domain

### 3. Add to GitHub Profile

#### Option A: Pin Repository

1. Go to your GitHub profile
2. Click "Customize your pins"
3. Select your `url-shortener` repository
4. Add a description: "🔗 Modern URL shortener built with TypeScript, React & Express"

#### Option B: Add to README

Add this to your profile README:

```markdown
## 🔗 URL Shortener

A modern URL shortener built with TypeScript, React, and Express.js.

**Live Demo:** [your-railway-domain.railway.app](https://your-railway-domain.railway.app)

**Features:**
- ⚡ Fast URL shortening
- 📊 Click tracking
- 🎨 Modern UI
- 📱 Mobile responsive

**Tech Stack:**
- TypeScript
- React
- Express.js
- Railway (deployment)
```

## 🎯 Customization

### Custom Domain (Optional)

1. In Railway dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Environment Variables

Add these in Railway dashboard if needed:

- `NODE_ENV=production`
- `PORT=3000` (automatically set by Railway)

## 🔍 Testing Your Deployment

1. Visit your Railway domain
2. Try shortening a URL
3. Test the redirect functionality
4. Check that click tracking works

## 📊 Monitoring

Railway provides built-in monitoring:
- View logs in the Railway dashboard
- Monitor performance metrics
- Set up alerts if needed

## 🚀 Advanced Features

### Database Integration

For production use, consider adding a database:

1. **PostgreSQL** (Railway add-on)
2. **MongoDB** (Railway add-on)
3. **Redis** (for caching)

### Custom Short Codes

Modify `src/server.ts` to support custom short codes:

```typescript
app.post('/api/shorten', (req, res) => {
  const { url, customCode } = req.body;
  
  if (customCode) {
    // Check if custom code is available
    if (urlDatabase.has(customCode)) {
      return res.status(400).json({ error: 'Custom code already exists' });
    }
    // Use custom code
  }
  // ... rest of the logic
});
```

## 🛠️ Troubleshooting

### Common Issues

1. **Build fails**: Check that all dependencies are in `package.json`
2. **App won't start**: Verify the `start` script in `package.json`
3. **Static files not served**: Ensure React build is in `client/build`

### Railway Logs

```bash
railway logs
```

### Local Testing

```bash
# Test production build locally
npm run build
npm start
```

## 🎉 Success!

Your URL shortener is now live and ready to use! Share it with friends, add it to your portfolio, or use it for your own projects.

**Next Steps:**
- Add analytics
- Implement user authentication
- Add custom domains
- Set up monitoring alerts
