# ReColor AI - Quick Start Guide

Get your SaaS photo colorization app running in 15 minutes!

## 🚀 Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works)
- Google AI Studio account for Gemini API

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
npm install
npm install -g wrangler
```

### 2. Authenticate with Cloudflare
```bash
wrangler login
```

### 3. Create Cloudflare Resources
```bash
# Create D1 database
npm run cf:d1:create

# Create R2 bucket  
npm run cf:r2:create
```

### 4. Update Configuration
Copy the database ID from step 3 output and update `wrangler.toml`:
```toml
database_id = "your-actual-database-id-here"
```

### 5. Run Database Migrations
```bash
npm run db:migrate:local
npm run db:migrate
```

### 6. Set Environment Variables
```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your values:
```env
BETTERAUTH_SECRET=your_32_character_secret_here
GEMINI_API_KEY=your_gemini_api_key
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_PUBLIC_URL=https://your-bucket.your-account-id.r2.cloudflarestorage.com
```

### 7. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and start using your app!

## 🎯 Getting API Keys

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Copy to `.env.local`

### R2 API Keys
1. Cloudflare Dashboard → R2 → Manage R2 API tokens
2. Create token with R2:Edit permissions
3. Copy Access Key ID and Secret Access Key

### BetterAuth Secret
```bash
openssl rand -base64 32
```

## 🚀 Deploy to Production

### Quick Deploy
```bash
npm run deploy
```

### Set Production Secrets
```bash
wrangler pages secret put BETTERAUTH_SECRET
wrangler pages secret put GEMINI_API_KEY
wrangler pages secret put R2_ACCESS_KEY_ID
wrangler pages secret put R2_SECRET_ACCESS_KEY
```

## 🧪 Test the App

1. **Sign Up**: Create a new account
2. **Upload**: Upload a black & white photo
3. **Process**: Wait for AI colorization
4. **View**: Check your dashboard for results

## 📚 Next Steps

- Read [README.md](./README.md) for detailed features
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- Review [FEATURES.md](./FEATURES.md) for technical details

## 🆘 Troubleshooting

### Common Issues

**"Database not found"**
- Run migrations: `npm run db:migrate:local`
- Check database ID in `wrangler.toml`

**"R2 upload failed"**
- Verify R2 API keys in `.env.local`
- Check bucket name matches configuration

**"Gemini API error"**
- Verify API key is valid
- Check API quotas in Google AI Studio

**"Authentication not working"**
- Ensure `BETTERAUTH_SECRET` is set
- Try clearing browser cookies

### Get Help
- Check Cloudflare documentation
- Review error logs with `wrangler pages deployment tail`
- Verify environment variables are set correctly

---

🎉 **Congratulations!** Your SaaS photo colorization app is ready to use!
