# Migration Guide: Cloudflare D1 to Neon PostgreSQL with Prisma

This guide will help you migrate from Cloudflare D1 (SQLite) to Neon PostgreSQL using Prisma ORM.

## Prerequisites

1. A Neon PostgreSQL database account
2. Node.js and npm installed
3. Your existing environment variables

## Step 1: Set up Neon PostgreSQL Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string from the dashboard
4. Create a `.env` file in your project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Better Auth
BETTERAUTH_SECRET="your-secret-key-here"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudflare R2 (for image storage)
R2_BUCKET="your-r2-bucket"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_PUBLIC_URL="https://your-account-id.r2.cloudflarestorage.com"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"
```

## Step 2: Install Dependencies

The migration has already been completed in the codebase. The following packages have been added:

- `prisma` - Prisma ORM
- `@prisma/client` - Prisma client

And removed:
- `better-sqlite3` - No longer needed
- `@types/better-sqlite3` - No longer needed

## Step 3: Generate Prisma Client

```bash
npm run db:generate
```

## Step 4: Run Database Migrations

```bash
npm run db:migrate
```

This will create the database tables based on the Prisma schema.

## Step 5: Migrate Existing Data (Optional)

If you have existing data in your SQLite database, you'll need to export it and import it into PostgreSQL. Here's a general approach:

1. Export data from SQLite:
```bash
# Export users
sqlite3 dev.db "SELECT * FROM user;" > users_export.csv

# Export jobs
sqlite3 dev.db "SELECT * FROM jobs;" > jobs_export.csv

# Export sessions
sqlite3 dev.db "SELECT * FROM session;" > sessions_export.csv

# Export accounts
sqlite3 dev.db "SELECT * FROM account;" > accounts_export.csv

# Export verifications
sqlite3 dev.db "SELECT * FROM verification;" > verifications_export.csv
```

2. Import data into PostgreSQL using Prisma or direct SQL:
```bash
# Use psql or a PostgreSQL client to import the data
# You may need to adjust the data format and handle ID conflicts
```

## Step 6: Update Environment Variables

Make sure your environment variables are properly set:

- `DATABASE_URL` should point to your Neon PostgreSQL database
- Remove any Cloudflare-specific environment variables if not needed
- Keep your existing OAuth, R2, and API keys

## Step 7: Test the Application

1. Start the development server:
```bash
npm run dev
```

2. Test the following features:
   - User authentication (Google OAuth)
   - Job creation and management
   - Image upload and processing
   - Database queries

## Step 8: Deploy to Production

1. Update your production environment variables with the Neon database URL
2. Run the migration in production:
```bash
npm run db:deploy
```

3. Deploy your application

## Changes Made

### Database Layer
- Replaced `better-sqlite3` with Prisma ORM
- Updated database helper functions to use Prisma queries
- Changed job status values from lowercase to uppercase (PENDING, PROCESSING, DONE, FAILED)

### Authentication
- Updated `better-auth` configuration to use Prisma instead of SQLite
- Maintained all existing authentication functionality

### API Routes
- Updated all API routes to use the new database helper
- Removed Cloudflare D1-specific code
- Updated job status references to use new enum values

### Package Scripts
- Removed Cloudflare-specific scripts (`db:migrate`, `cf:login`, etc.)
- Added Prisma scripts (`db:generate`, `db:migrate`, `db:deploy`, `db:studio`)

## Troubleshooting

### Common Issues

1. **Connection Issues**: Make sure your `DATABASE_URL` is correct and includes SSL mode
2. **Migration Errors**: Check that your Prisma schema matches your database structure
3. **Authentication Issues**: Verify that your OAuth credentials are still valid
4. **Job Status Errors**: Ensure all job status references use the new uppercase values

### Useful Commands

```bash
# View database in Prisma Studio
npm run db:studio

# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Check database status
npx prisma db status

# Generate Prisma client after schema changes
npm run db:generate
```

## Benefits of the Migration

1. **Better Performance**: PostgreSQL is more performant than SQLite for concurrent operations
2. **Scalability**: Neon provides serverless PostgreSQL with automatic scaling
3. **Type Safety**: Prisma provides excellent TypeScript support
4. **Developer Experience**: Prisma Studio offers a great database management interface
5. **Production Ready**: PostgreSQL is more suitable for production workloads

## Support

If you encounter any issues during the migration, please check:
1. The Prisma documentation: https://www.prisma.io/docs
2. The Neon documentation: https://neon.tech/docs
3. The Better Auth documentation: https://www.better-auth.com/docs
