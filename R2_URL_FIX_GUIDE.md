# R2 URL Configuration Fix

## Problem
Images were not loading after upload because the URLs were being constructed incorrectly. The code was adding the bucket name to the path when it shouldn't have been.

## What Was Fixed

### 1. Upload URL Construction (`/api/upload-via-presigned/route.ts`)
**Before:**
```javascript
const originalUrl = `${env.R2_PUBLIC_URL}/${env.R2_BUCKET}/${fileKey}`;
```

**After:**
```javascript
// For R2.dev public URLs, don't include bucket name in the path
const originalUrl = `${env.R2_PUBLIC_URL}/${fileKey}`;
```

### 2. Output URL Construction (`/api/submit-job/route.ts`)
**Before:**
```javascript
const outputUrl = `${env.R2_PUBLIC_URL}/${env.R2_BUCKET}/${outputKey}`;
```

**After:**
```javascript
// For R2.dev public URLs, don't include bucket name in the path
const outputUrl = `${env.R2_PUBLIC_URL}/${outputKey}`;
```

### 3. Transform Function (`/api/get-image-url/route.ts`)
Updated to handle both old URLs (with bucket name) and new URLs (without bucket name) for backwards compatibility.

### 4. Client-Side Utils (`/lib/utils.ts`)
Added URL cleanup and better comments explaining R2.dev URL format.

### 5. Client-Side Page (`/app/page.tsx`)
Added trailing slash cleanup for output URL construction.

## Required Environment Variables

Make sure you have these environment variables set correctly:

### Server-Side (`.env` or `.env.local`)
```env
# R2 Storage Configuration
R2_BUCKET=your-bucket-name                                    # e.g., "recolor-images"
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_PUBLIC_URL=https://pub-xxxx.r2.dev                        # Your R2 public URL WITHOUT bucket name
R2_ACCOUNT_ID=your-cloudflare-account-id                     # Required for R2.dev URLs (32-char hex string)
```

**How to find your R2_ACCOUNT_ID:**
1. Go to Cloudflare Dashboard
2. In the URL bar, you'll see: `https://dash.cloudflare.com/{ACCOUNT_ID}/r2/...`
3. The `{ACCOUNT_ID}` is a 32-character hexadecimal string
4. Alternatively, go to R2 Overview, and look at the API endpoint format shown there

### Client-Side (must start with `NEXT_PUBLIC_`)
```env
# This MUST match your R2_PUBLIC_URL for client-side access
NEXT_PUBLIC_R2_URL=https://pub-xxxx.r2.dev                   # Same as R2_PUBLIC_URL, no bucket name
```

## R2 Bucket Configuration Requirements

### 1. Enable Public Access
Your R2 bucket must have public access enabled:
1. Go to Cloudflare Dashboard → R2 → Your Bucket
2. Click "Settings"
3. Under "Public Access", enable public access
4. You'll get a URL like: `https://pub-xxxxxxxxxxxx.r2.dev`

### 2. Configure CORS
Add CORS rules to allow browser access:
1. Go to your R2 bucket settings
2. Add CORS rule:
```json
{
  "AllowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
```

### 3. Custom Domain (Optional but Recommended)
For better performance and branding:
1. In R2 bucket settings, add a custom domain
2. Point your DNS to Cloudflare
3. Update environment variables to use your custom domain
```env
R2_PUBLIC_URL=https://images.your-domain.com
NEXT_PUBLIC_R2_URL=https://images.your-domain.com
```

## URL Format Examples

### Correct Format (R2.dev subdomain)
- ✅ `https://pub-xxxx.r2.dev/uploads/jobId-filename.jpg`
- ✅ `https://pub-xxxx.r2.dev/outputs/jobId-colorized.jpg`

### Incorrect Format (includes bucket name)
- ❌ `https://pub-xxxx.r2.dev/bucket-name/uploads/jobId-filename.jpg`
- ❌ `https://pub-xxxx.r2.dev/bucket-name/outputs/jobId-colorized.jpg`

### Custom Domain Format
- ✅ `https://images.your-domain.com/uploads/jobId-filename.jpg`
- ✅ `https://images.your-domain.com/outputs/jobId-colorized.jpg`

## Testing

After applying these fixes and configuring your environment:

1. **Clear existing data** (optional, for testing):
   ```bash
   # If you want to test with fresh uploads
   npm run prisma:studio
   # Delete old job records or just test with new uploads
   ```

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

3. **Upload a new image** and check:
   - Open browser DevTools (Network tab)
   - Upload an image
   - Check the Network tab for image requests
   - The URLs should NOT include the bucket name in the path
   - Images should load successfully (status 200)

4. **Check for CORS errors**:
   - If you see CORS errors in the console, configure CORS rules in R2

## Troubleshooting

### Images still not loading?

1. **Check the URL format** in browser DevTools:
   - Right-click on the broken image → "Copy Image Address"
   - Verify it matches the correct format above
   - Should be: `https://pub-xxx.r2.dev/uploads/jobId-filename.jpg`
   - Should NOT be: `https://pub-xxx.r2.dev/jobId-filename.jpg` (missing uploads/ prefix)

2. **Test R2 URL directly**:
   ```bash
   curl -I https://pub-xxxx.r2.dev/uploads/test-file.jpg
   ```
   - Should return 200 OK (if file exists)
   - If 403 Forbidden → Enable public access
   - If 404 Not Found → File doesn't exist or wrong URL

3. **Check environment variables**:
   ```bash
   echo $R2_PUBLIC_URL
   echo $NEXT_PUBLIC_R2_URL
   echo $R2_ACCOUNT_ID
   ```
   - All should be set correctly
   - R2_ACCOUNT_ID is **required** for R2.dev URLs
   - Should NOT have trailing slashes
   - Should NOT include bucket name

4. **Error: "R2_ACCOUNT_ID is required when using R2.dev public URLs"**:
   - This means you're using an R2.dev public URL but haven't set R2_ACCOUNT_ID
   - Find your account ID in Cloudflare Dashboard URL
   - Add it to your `.env` file: `R2_ACCOUNT_ID=your-32-char-account-id`
   - Restart your dev server

5. **CORS issues**:
   - Check browser console for CORS errors
   - Verify CORS rules in R2 bucket settings
   - Ensure your domain is in AllowedOrigins

6. **Check database records**:
   ```bash
   npm run prisma:studio
   ```
   - Look at the `originalUrl` and `outputUrl` fields
   - New records should have correct URL format
   - Old records may still have bucket name in path (will be transformed by get-image-url API)

## Migration from Old URLs

If you have existing jobs with old URL format, they will still work because:
1. The `transformToPublicUrl` function handles backwards compatibility
2. It detects old format and transforms to new format
3. No database migration needed

However, new uploads will use the correct format immediately.

## Summary

The fix ensures that:
- ✅ URLs are constructed without bucket name in the path
- ✅ R2.dev subdomain URLs work correctly
- ✅ Custom domain URLs work correctly
- ✅ Backwards compatibility with old URLs
- ✅ CORS is properly handled
- ✅ Images load directly from R2 CDN without proxy

