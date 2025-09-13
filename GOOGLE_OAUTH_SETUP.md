# Google OAuth Setup Guide

This guide will help you set up Google OAuth for your SaaS recolor application.

## Prerequisites

1. A Google Cloud Platform account
2. A project in Google Cloud Console

## Setup Steps

### 1. Create OAuth 2.0 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure the consent screen if prompted
6. Choose "Web application" as the application type
7. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`

### 2. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Better Auth Configuration
BETTERAUTH_SECRET=your-secret-key-here-generate-a-long-random-string
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-from-step-1
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-step-1

# Database Configuration  
DATABASE_URL=your-database-url
```

### 3. Features Implemented

✅ **Google Sign-In Button**: Added to both login and signup pages
✅ **Modern UI**: Enhanced login/signup pages with:
- Gradient backgrounds
- Clean card design
- Google branding
- Loading states
- Error handling
- Smooth animations

✅ **Authentication Flow**: 
- Google OAuth integration with Better Auth
- Fallback to email/password authentication
- Automatic redirect to dashboard after successful login
- Session management

### 4. Usage

1. Users can click "Continue with Google" on login/signup pages
2. They'll be redirected to Google for authentication
3. After approval, they'll be redirected back to your dashboard
4. Email/password authentication still works as a fallback

### 5. Testing

1. Set up your environment variables
2. Run `npm run dev`
3. Navigate to `/login` or `/signup`
4. Test both Google OAuth and email/password authentication

### 6. Production Deployment

1. Update `NEXT_PUBLIC_BETTER_AUTH_URL` to your production domain
2. Add production redirect URI to Google OAuth settings
3. Ensure all environment variables are set in your production environment

## Troubleshooting

- **"Invalid client" error**: Check that your client ID and secret are correct
- **Redirect URI mismatch**: Ensure the redirect URI in Google Console matches your app
- **CORS issues**: Make sure your domain is properly configured in Google Console

## Security Notes

- Keep your `GOOGLE_CLIENT_SECRET` secure and never expose it in client-side code
- Use a strong, random `BETTERAUTH_SECRET`
- Regularly rotate your secrets
- Use HTTPS in production
