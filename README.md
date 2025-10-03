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

- **Credit Packages**: 4 different packages from ₹149 to ₹2499
- **Secure Payments**: Hosted checkout with PhonePe's secure payment page
- **Real-time Updates**: Webhook-based payment status updates
- **Automatic Credit Addition**: Credits are added automatically upon successful payment

### Credit Packages

| Package | Credits | Price | Best For |
|---------|---------|-------|----------|
| Starter Pack | 1 | ₹49 | Trying the service |
| Value Pack | 5 | ₹199 | Regular users |
| Pro Pack | 12 | ₹399 | Power users |
| Business Pack | 35 | ₹999 | Teams & businesses |

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Cloudflare Pages.

Quick deployment:
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

# AI Service
GEMINI_API_KEY=your-gemini-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
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

- **Cloudflare Analytics**: Traffic and performance metrics
- **Database Analytics**: Database usage and performance
- **R2 Analytics**: Storage usage and bandwidth
- **Pages Functions**: Execution logs and errors

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
