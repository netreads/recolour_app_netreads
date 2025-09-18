# Cloudflare Pages Deployment Guide

This guide will help you deploy your Next.js SaaS Recolor app to Cloudflare Pages with BetterAuth authentication.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Database**: Set up a PostgreSQL database (recommended: Neon, Supabase, or Railway)
4. **Google OAuth**: Set up Google OAuth credentials
5. **Cloudflare R2**: Set up R2 bucket for image storage

## Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

## Step 2: Set up Environment Variables

You'll need to set these environment variables in Cloudflare Pages:

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# BetterAuth Configuration
BETTERAUTH_SECRET="your-secret-key-here"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-domain.pages.dev"
NEXT_PUBLIC_APP_URL="https://your-domain.pages.dev"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudflare R2 Storage
R2_BUCKET_NAME="recolor-images"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_REGION="auto"

# AWS S3 Compatible (for R2)
AWS_ACCESS_KEY_ID="your-r2-access-key"
AWS_SECRET_ACCESS_KEY="your-r2-secret-key"
AWS_REGION="auto"
AWS_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"

# Cashfree Payment Gateway
CASHFREE_APP_ID="your-cashfree-app-id"
CASHFREE_SECRET_KEY="your-cashfree-secret-key"
CASHFREE_ENVIRONMENT="sandbox"  # Use "production" for live environment

# Environment
NODE_ENV="production"
```

## Step 3: Deploy to Cloudflare Pages

### Option A: Deploy via Wrangler CLI

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
npm run pages:deploy
```

### Option B: Deploy via Cloudflare Dashboard

1. Go to [Cloudflare Pages](https://pages.cloudflare.com)
2. Click "Create a project"
3. Connect your GitHub repository
4. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (or leave empty)
5. Add all environment variables from Step 2
6. Deploy!

## Step 4: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-domain.pages.dev/api/auth/callback/google`
6. Update your environment variables with the new credentials

## Step 5: Set up Cashfree Payment Gateway

1. **Create Cashfree Account**:
   - Sign up at [Cashfree](https://www.cashfree.com/)
   - Complete merchant verification process

2. **Get API Credentials**:
   - Go to [Cashfree Dashboard](https://merchant.cashfree.com/)
   - Navigate to "Developers" → "API Keys"
   - Copy your App ID and Secret Key
   - Add them to your environment variables

3. **Configure Webhooks**:
   - In Cashfree Dashboard, go to "Developers" → "Webhooks"
   - Add webhook URL: `https://your-domain.pages.dev/api/payments/webhook`
   - Enable events: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`, `PAYMENT_USER_DROPPED_WEBHOOK`

4. **Test Payments**:
   - Use sandbox environment for testing
   - Test cards: 4111 1111 1111 1111 (success), 4000 0000 0000 0002 (failure)
   - Switch to production when ready to go live

## Step 6: Set up Cloudflare R2

1. Go to [Cloudflare R2](https://dash.cloudflare.com/r2)
2. Create a new bucket named `recolor-images`
3. Generate API tokens with R2 permissions
4. Update environment variables with R2 credentials

## Step 7: Database Setup

1. Set up a PostgreSQL database (recommended providers):
   - [Neon](https://neon.tech) - Free tier available
   - [Supabase](https://supabase.com) - Free tier available
   - [Railway](https://railway.app) - Free tier available

2. Run database migrations:
```bash
npx prisma migrate deploy
```

## Step 7: Test Your Deployment

1. Visit your deployed URL
2. Test Google sign-in functionality
3. Verify image upload and processing works
4. Check that sessions persist correctly

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check that `NEXT_PUBLIC_BETTER_AUTH_URL` matches your domain exactly
2. **Database connection errors**: Verify `DATABASE_URL` is correct and accessible
3. **R2 upload failures**: Check R2 credentials and bucket permissions
4. **Build failures**: Ensure all dependencies are properly installed

### Debug Commands

```bash
# Test local build
npm run build

# Test with Cloudflare Pages dev
npm run pages:dev

# Check environment variables
wrangler pages env list
```

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for `BETTERAUTH_SECRET`
- Regularly rotate API keys and secrets
- Enable Cloudflare security features (WAF, Bot Fight Mode)

## Support

If you encounter issues:
1. Check Cloudflare Pages build logs
2. Verify all environment variables are set correctly
3. Test locally with `npm run pages:dev`
4. Check BetterAuth documentation for authentication issues
