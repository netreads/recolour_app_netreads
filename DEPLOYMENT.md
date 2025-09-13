# ReColor AI - Deployment Guide

This guide will help you deploy your ReColor AI SaaS application to Cloudflare Pages with D1 database and R2 storage.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js**: Version 18+ installed
3. **Wrangler CLI**: Install globally with `npm install -g wrangler`
4. **Google AI Studio Account**: For Gemini API access

## Step 1: Set up Cloudflare Services

### 1.1 Install Dependencies

```bash
npm install
```

### 1.2 Authenticate with Cloudflare

```bash
wrangler login
```

### 1.3 Create D1 Database

```bash
wrangler d1 create recolor_db_netreads
```

Copy the database ID from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "recolor_db_netreads"
database_id = "your-actual-database-id-here"
```

### 1.4 Run Database Migrations

```bash
wrangler d1 migrations apply recolor_db_netreads --local
wrangler d1 migrations apply recolor_db_netreads --remote
```

### 1.5 Create R2 Bucket

```bash
wrangler r2 bucket create recolor-images
```

### 1.6 Generate R2 API Token

1. Go to Cloudflare Dashboard > R2 > Manage R2 API tokens
2. Create a new token with R2:Edit permissions
3. Note down the Access Key ID and Secret Access Key

## Step 2: Configure Environment Variables

### 2.1 Local Development

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your actual values:

```env
# BetterAuth Configuration
BETTERAUTH_SECRET=generate_a_random_32_character_string_here

# Database Configuration (for local development)
DATABASE_URL=file:./dev.db

# Cloudflare R2 Configuration
R2_BUCKET=recolor-images
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_PUBLIC_URL=https://recolor-images.your-account-id.r2.cloudflarestorage.com

# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Production Environment Variables

Set environment variables for Cloudflare Pages:

```bash
# Set secrets for Pages
wrangler pages secret put BETTERAUTH_SECRET
wrangler pages secret put R2_ACCESS_KEY_ID
wrangler pages secret put R2_SECRET_ACCESS_KEY
wrangler pages secret put GEMINI_API_KEY

# Set regular environment variables
wrangler pages secret put R2_BUCKET --value "recolor-images"
wrangler pages secret put R2_PUBLIC_URL --value "https://recolor-images.your-account-id.r2.cloudflarestorage.com"
```

## Step 3: Get API Keys

### 3.1 Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key to your environment variables

### 3.2 Generate BetterAuth Secret

```bash
openssl rand -base64 32
```

## Step 4: Build and Deploy

### 4.1 Build the Application

```bash
npm run build
```

### 4.2 Deploy to Cloudflare Pages

#### Option A: Using Wrangler CLI

```bash
wrangler pages deploy .next --project-name saas-recolor
```

#### Option B: Using Git Integration

1. Push your code to GitHub
2. Go to Cloudflare Dashboard > Pages
3. Create a new project
4. Connect your GitHub repository
5. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Node.js version**: 18

### 4.3 Configure Pages Functions

Ensure your `wrangler.toml` bindings are properly configured in the Pages dashboard:

1. Go to your Pages project > Settings > Functions
2. Add the D1 database binding: `DB` → `recolor_db_netreads`
3. Add the R2 bucket binding: `R2_BUCKET` → `recolor-images`

## Step 5: Configure Custom Domain (Optional)

1. Go to Pages project > Custom domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `R2_PUBLIC_URL` and `NEXT_PUBLIC_APP_URL` environment variables

## Step 6: Test the Deployment

1. Visit your deployed application
2. Sign up for a new account
3. Upload a test image
4. Verify the colorization process works

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify D1 database ID in `wrangler.toml`
   - Ensure migrations have been applied

2. **R2 Upload Errors**
   - Check R2 API credentials
   - Verify bucket name and permissions
   - Ensure R2_PUBLIC_URL is correct

3. **Gemini API Errors**
   - Verify API key is valid
   - Check API quotas and billing

4. **Authentication Issues**
   - Ensure BETTERAUTH_SECRET is set
   - Check that cookies are working (domain settings)

### Logs and Debugging

```bash
# View Pages Functions logs
wrangler pages deployment tail --project-name saas-recolor

# View D1 database
wrangler d1 execute recolor_db_netreads --command "SELECT * FROM users LIMIT 10"

# View R2 bucket contents
wrangler r2 object list recolor-images
```

## Monitoring and Maintenance

1. **Monitor Usage**: Check Cloudflare Analytics for traffic and usage
2. **Database Maintenance**: Regularly check D1 database size and performance
3. **R2 Storage**: Monitor storage usage and costs
4. **API Limits**: Keep track of Gemini API usage

## Scaling Considerations

1. **D1 Limitations**: Current limits are 5GB per database
2. **R2 Costs**: Monitor storage and bandwidth costs
3. **Gemini API**: Consider rate limiting for high traffic
4. **Pages Functions**: Monitor execution time and memory usage

## Security Checklist

- [ ] Environment variables are properly secured
- [ ] R2 bucket has appropriate CORS settings
- [ ] Database has proper foreign key constraints
- [ ] Authentication middleware protects all sensitive routes
- [ ] API rate limiting is implemented (recommended)
- [ ] Input validation is in place for file uploads

## Support

For issues related to:
- **Cloudflare Services**: Check Cloudflare docs and community
- **BetterAuth**: Check BetterAuth documentation
- **Gemini API**: Check Google AI documentation
- **Next.js**: Check Next.js documentation

---

**Note**: Replace all placeholder values (like `your-account-id`, `your_api_key_here`) with your actual values before deploying.
