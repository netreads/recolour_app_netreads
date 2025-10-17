# Scripts

This directory contains utility scripts for managing the application.

## cleanup-r2-old-files.js

Automatically deletes old files from Cloudflare R2 bucket's `uploads/` and `outputs/` folders.

### Prerequisites

1. Environment variables must be set:
   - `R2_BUCKET`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_ACCOUNT_ID` or `R2_PUBLIC_URL` (to derive account ID)

2. Dependencies are already installed via `package.json`

### Usage

**Quick commands using npm scripts:**

```bash
# Dry run (recommended first) - Shows what would be deleted
npm run cleanup:r2:dry-run

# Actually delete files older than 2 days
npm run cleanup:r2
```

**Advanced usage with direct node command:**

```bash
# Dry run with custom days
node scripts/cleanup-r2-old-files.js --days=7 --dry-run

# Delete files older than custom number of days
node scripts/cleanup-r2-old-files.js --days=3
```

### Automation

To run this automatically, you can:

1. **Using cron** (on a server):
   ```bash
   # Run daily at 2 AM
   0 2 * * * cd /path/to/project && node scripts/cleanup-r2-old-files.js
   ```

2. **Using Vercel Cron Jobs** (if using Vercel):
   - Create an API route at `app/api/cron/cleanup-r2/route.ts`
   - Add the cron job to `vercel.json`:
     ```json
     {
       "crons": [{
         "path": "/api/cron/cleanup-r2",
         "schedule": "0 2 * * *"
       }]
     }
     ```

3. **Using GitHub Actions** (runs on GitHub's infrastructure):
   - Create `.github/workflows/cleanup-r2.yml`:
     ```yaml
     name: Cleanup R2 Storage
     on:
       schedule:
         - cron: '0 2 * * *'  # Daily at 2 AM UTC
       workflow_dispatch:  # Allow manual trigger
     
     jobs:
       cleanup:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v3
           - uses: actions/setup-node@v3
             with:
               node-version: '20'
           - run: npm install
           - run: node scripts/cleanup-r2-old-files.js
             env:
               R2_BUCKET: ${{ secrets.R2_BUCKET }}
               R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
               R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
               R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
     ```

### Output

The script provides detailed output:
- Total files found in each folder
- Number of files older than the cutoff date
- Total size of data to be deleted
- Oldest and newest files to be deleted
- Summary of deletion results

### Safety Features

- **Dry run mode**: Test before actual deletion
- **Detailed logging**: See exactly what will be deleted
- **Error handling**: Shows errors for files that couldn't be deleted
- **Batch processing**: Efficiently handles large numbers of files
- **Date-based filtering**: Only deletes files older than specified days

### Example Output

```
🧹 R2 Cleanup Script
==================
Bucket: my-bucket
Cutoff Date: 2025-10-15T00:00:00.000Z (2 days old)
Mode: 🔍 DRY RUN (no deletions)

📁 Processing folder: uploads/
   Found 150 total objects
   Found 45 objects older than 2 days
   Total size to delete: 123.45 MB
   Oldest: uploads/abc123-image.jpg (2025-10-10T08:30:00.000Z)
   Newest: uploads/def456-photo.png (2025-10-14T23:59:00.000Z)
   🔍 Would delete 45 objects

📁 Processing folder: outputs/
   Found 200 total objects
   Found 60 objects older than 2 days
   Total size to delete: 234.56 MB
   Oldest: outputs/xyz789-colorized.jpg (2025-10-09T12:00:00.000Z)
   Newest: outputs/uvw012-colorized.jpg (2025-10-14T22:00:00.000Z)
   🔍 Would delete 60 objects

📊 Summary
=========
Uploads: 45/150 would be deleted
Outputs: 60/200 would be deleted
Total: 105/350 would be deleted

💡 Run without --dry-run to actually delete the files
```

