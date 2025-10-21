# ReColor AI - SaaS Photo Colorization Platform

A full-stack SaaS application that uses AI to colorize black and white photos. Built with Next.js 14, deployed on Cloudflare Pages with PostgreSQL database, R2 storage, and powered by Google Gemini AI.

## 🌟 Features

- **AI-Powered Colorization**: Uses Google Gemini API to intelligently colorize black and white photos
- **User Authentication**: Secure email/password authentication with BetterAuth
- **Payment Integration**: PhonePe payment gateway for credit purchases
- **Credit System**: Purchase credits to colorize images with flexible pricing packages
- **Cloud Storage**: Images stored on Cloudflare R2 with presigned URLs
- **Real-time Dashboard**: Track upload progress and view colorization results
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **Edge Computing**: Deployed on Cloudflare Pages for global performance

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for styling
- **React** with modern hooks and client components

### Backend
- **Cloudflare Pages Functions** for serverless API routes
- **BetterAuth** for authentication and session management
- **PostgreSQL** for database (via Prisma)
- **Cloudflare R2** for image storage

### AI & External Services
- **Google Gemini API** for image colorization
- **PhonePe Payment Gateway** for payment processing
- **AWS4Fetch** for R2 presigned URL generation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account
- Google AI Studio account (for Gemini API)
- PhonePe merchant account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd saas-recolor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your API keys and configuration values.

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Pages Functions)
│   │   ├── auth/          # BetterAuth endpoints
│   │   ├── get-upload-url/ # R2 presigned URL generation
│   │   ├── submit-job/    # AI processing endpoint
│   │   └── jobs/          # Job listing endpoint
│   ├── dashboard/         # Protected dashboard page
│   ├── login/            # Authentication pages
│   ├── signup/
│   └── layout.tsx        # Root layout
├── components/           # Reusable React components
│   ├── Navbar.tsx       # Navigation with auth state
│   ├── Footer.tsx
│   └── ...
├── lib/                 # Utility libraries
│   ├── auth.ts         # BetterAuth configuration
│   └── db.ts           # Database helpers
└── middleware.ts       # Route protection
```

## 🔐 Authentication Flow

1. **Sign Up**: Users create accounts with email/password
2. **Login**: Secure session management with BetterAuth
3. **Session**: Persistent sessions with HTTP-only cookies
4. **Protection**: Middleware protects dashboard and API routes

## 📊 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_url TEXT NOT NULL,
  output_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

## 🎨 How It Works

1. **Sign Up**: Users create accounts and get 1 free credit
2. **Purchase Credits**: Users can buy credit packages through PhonePe payment gateway
3. **Upload**: User uploads a black and white photo (consumes 1 credit)
4. **Storage**: Image is stored in Cloudflare R2 via presigned URL
5. **Processing**: Google Gemini AI colorizes the image
6. **Result**: Colorized image is stored and displayed in dashboard

## 💳 Payment System

The application uses PhonePe payment gateway for credit purchases:

- **Secure Payments**: Hosted checkout with PhonePe's secure payment page
- **Payment Verification**: Polling-based payment verification with exponential backoff
- **Automatic Access**: Jobs are automatically marked as paid and downloadable upon payment confirmation

### Payment Flow

1. **Order Creation**: User initiates payment, creates order in database
2. **PhonePe Redirect**: User redirected to PhonePe payment page
3. **Payment Completion**: User completes payment on PhonePe
4. **Return to Site**: User redirected back to success page
5. **Payment Verification**: Success page polls PhonePe API to verify payment (15 attempts over ~45 seconds)
6. **Order Update**: Once verified, order marked as PAID and job marked as paid for download access
7. **Image Display**: Colorized image loaded securely via download API

**Note**: Payment verification uses polling (no webhooks) with exponential backoff to minimize API calls and costs.

## ⚡ Performance & Cost Optimizations

This application includes comprehensive optimizations to reduce Vercel hosting costs by **50-60%** while maintaining full functionality and UI quality:

- **Image Proxy Caching**: Aggressive CDN caching with 1-year TTL reduces function invocations by 70-80%
- **API Route Caching**: Smart caching with stale-while-revalidate reduces database queries by 40-50%
- **Next.js Image Optimization**: Automatic WebP conversion and responsive images reduce bandwidth by 30-40%
- **Bundle Optimization**: Tree-shaking and minification reduce cold start times by 15-20%
- **Database Query Optimization**: Production logging disabled for faster execution times

See [VERCEL_COST_OPTIMIZATIONS.md](./VERCEL_COST_OPTIMIZATIONS.md) for detailed documentation.

## 🚀 Deployment

**Vercel Deployment** (Recommended):
```bash
npm run build
vercel deploy
```

**Cloudflare Pages** (Alternative):
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Cloudflare Pages.

```bash
npm run build
wrangler pages deploy .next --project-name saas-recolor
```

## 🔧 Environment Variables

```env
# Authentication
BETTERAUTH_SECRET=your_secret_key

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Cloudflare R2
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
R2_ACCOUNT_ID=your-r2-account-id  # Required for R2.dev URLs

# AI Service
GEMINI_API_KEY=your-gemini-api-key

# PhonePe Payment Gateway
PHONEPE_CLIENT_ID=your-phonepe-client-id
PHONEPE_CLIENT_SECRET=your-phonepe-client-secret
PHONEPE_ENVIRONMENT=production  # or 'sandbox' for testing

# Facebook Tracking (Optional)
FACEBOOK_PIXEL_ID=your-pixel-id
FACEBOOK_CONVERSIONS_API_TOKEN=your-api-token

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_R2_URL=https://pub-xxxxx.r2.dev  # Must match your R2_PUBLIC_URL or use custom domain
```

## 📝 API Endpoints

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session
- `POST /api/get-upload-url` - Generate R2 upload URL
- `POST /api/submit-job` - Process image with AI
- `GET /api/jobs` - List user's jobs

## 🛡 Security Features

- **Authentication**: Secure password hashing with BetterAuth
- **Authorization**: Route-level protection with middleware
- **CORS**: Proper CORS configuration for R2 uploads
- **Input Validation**: File type and size validation
- **Session Management**: HTTP-only cookies with expiration

## 🔄 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 📊 Monitoring

### Vercel Deployment
- **Vercel Analytics**: Function invocations, bandwidth, and execution time
- **Vercel Edge Network**: CDN cache hit rates and global performance
- **Performance Dashboard**: Real-time cost tracking and optimization metrics

### Cloudflare Deployment
- **Cloudflare Analytics**: Traffic and performance metrics
- **Database Analytics**: Database usage and performance
- **R2 Analytics**: Storage usage and bandwidth
- **Pages Functions**: Execution logs and errors

### Cost Monitoring Best Practices
- Track function invocation counts (should see 60-70% reduction)
- Monitor cache hit rates (target >90% for image-proxy)
- Review monthly bandwidth usage trends
- Check average function execution times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Review Cloudflare documentation for platform-specific questions
- Check Google AI documentation for Gemini API issues

---

Built with ❤️ using Next.js, Cloudflare, and Google Gemini AI
