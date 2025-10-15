# Cloudflare R2 Image Migration Guide

## Why Cloudflare R2 is PERFECT for You

✅ **You're already using it** for user-uploaded images
✅ **Free egress bandwidth** (no charges for downloads)
✅ **Already configured** in your `next.config.ts`
✅ **R2.dev public URLs** work out of the box
✅ **Fast global CDN** with edge caching
✅ **No additional setup** needed

## Current Setup Analysis

Looking at your code, you have:
- R2 bucket: Configured via `R2_BUCKET` env var
- R2 public URL: `R2_PUBLIC_URL` env var
- Already serving user images from R2
- S3-compatible access already set up

## Migration Steps (10 Minutes)

### Step 1: Upload Static Images to R2

You have 2 options:

#### Option A: Using Cloudflare Dashboard (Easiest)
1. Go to https://dash.cloudflare.com
2. Navigate to **R2** → Your bucket (the one you're using for user images)
3. Create a new folder: `static-assets/examples/` (keeps things organized)
4. Click **Upload Files**
5. Upload all 6 images:
   ```
   festival-colour.jpg
   festival-original.jpg
   grandfather-colour.jpg
   grandfather-original.jpg
   indian-wedding-colour.jpg
   indian-wedding-original.jpg
   ```

#### Option B: Using Wrangler CLI (For developers)
```bash
# Install wrangler if you haven't
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Upload images to your R2 bucket
wrangler r2 object put YOUR_BUCKET_NAME/example-images/festival-colour.jpg --file=public/festival\ colour.jpg
wrangler r2 object put YOUR_BUCKET_NAME/example-images/festival-original.jpg --file=public/festival\ original.jpg
wrangler r2 object put YOUR_BUCKET_NAME/example-images/grandfather-colour.jpg --file=public/grandfather\ colour.jpg
wrangler r2 object put YOUR_BUCKET_NAME/example-images/grandfather-original.jpg --file=public/grandfather\ original.jpg
wrangler r2 object put YOUR_BUCKET_NAME/example-images/indian-wedding-colour.jpg --file=public/indian\ wedding\ colour.jpg
wrangler r2 object put YOUR_BUCKET_NAME/example-images/indian-wedding-original.jpg --file=public/indian\ wedding\ original.jpg
```

### Step 2: Get Your R2 Public URL

You already have this in your env vars! Check your `.env.local`:
```bash
R2_PUBLIC_URL=https://pub-xxxxxx.r2.dev
# OR
R2_PUBLIC_URL=https://yourbucket.r2.cloudflarestorage.com
```

Your images will be accessible at:
```
{R2_PUBLIC_URL}/example-images/festival-colour.jpg
{R2_PUBLIC_URL}/example-images/festival-original.jpg
{R2_PUBLIC_URL}/example-images/grandfather-colour.jpg
{R2_PUBLIC_URL}/example-images/grandfather-original.jpg
{R2_PUBLIC_URL}/example-images/indian-wedding-colour.jpg
{R2_PUBLIC_URL}/example-images/indian-wedding-original.jpg
```

### Step 3: Make R2 Public URL Available in Client

Add to your `.env.local` if not already there:
```bash
NEXT_PUBLIC_R2_URL=https://pub-xxxxxx.r2.dev
# OR use your custom domain if you have one
```

**Important:** The `NEXT_PUBLIC_` prefix makes it available in the browser.

### Step 4: Update page.tsx with R2 URLs

Replace the image sources in `src/app/page.tsx`:

**Before (Line ~730):**
```tsx
<Image
  src="/indian wedding original.jpg"
  alt="Indian wedding photo before colorization"
  width={400}
  height={400}
  className="aspect-square object-cover w-full h-full"
  loading="lazy"
  quality={75}
/>
```

**After:**
```tsx
<Image
  src={`${process.env.NEXT_PUBLIC_R2_URL}/example-images/indian-wedding-original.jpg`}
  alt="Indian wedding photo before colorization"
  width={400}
  height={400}
  className="aspect-square object-cover w-full h-full"
  loading="lazy"
  quality={75}
/>
```

### Step 5: Complete Code Changes

Here are all 6 replacements for `src/app/page.tsx`:

```tsx
// Around line 730 - Indian wedding original
<Image
  src={`${process.env.NEXT_PUBLIC_R2_URL}/example-images/indian-wedding-original.jpg`}
  alt="Indian wedding photo before colorization"
  width={400}
  height={400}
  className="aspect-square object-cover w-full h-full"
  loading="lazy"
  quality={75}
/>

// Around line 744 - Indian wedding colour
<Image
  src={`${process.env.NEXT_PUBLIC_R2_URL}/example-images/indian-wedding-colour.jpg`}
  alt="Indian wedding photo after colorization"
  width={400}
  height={400}
  className="aspect-square object-cover w-full h-full"
  loading="lazy"
  quality={75}
/>

// Around line 770 - Grandfather original
<Image
  src={`${process.env.NEXT_PUBLIC_R2_URL}/example-images/grandfather-original.jpg`}
  alt="Grandfather portrait before colorization"
  width={400}
  height={400}
  className="aspect-square object-cover w-full h-full"
  loading="lazy"
  quality={75}
/>

// Around line 784 - Grandfather colour
<Image
  src={`${process.env.NEXT_PUBLIC_R2_URL}/example-images/grandfather-colour.jpg`}
  alt="Grandfather portrait after colorization"
  width={400}
  height={400}
  className="aspect-square object-cover w-full h-full"
  loading="lazy"
  quality={75}
/>

// Around line 811 - Festival original
<Image
  src={`${process.env.NEXT_PUBLIC_R2_URL}/example-images/festival-original.jpg`}
  alt="Festival celebration before colorization"
  width={400}
  height={400}
  className="aspect-square object-cover w-full h-full"
  loading="lazy"
  quality={75}
/>

// Around line 825 - Festival colour
<Image
  src={`${process.env.NEXT_PUBLIC_R2_URL}/example-images/festival-colour.jpg`}
  alt="Festival celebration after colorization"
  width={400}
  height={400}
  className="aspect-square object-cover w-full h-full"
  loading="lazy"
  quality={75}
/>
```

### Step 6: Update Vercel Environment Variables

Add the R2 public URL to Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Key:** `NEXT_PUBLIC_R2_URL`
   - **Value:** `https://pub-xxxxxx.r2.dev` (your R2 public URL)
   - **Environment:** Production, Preview, Development

### Step 7: No next.config.ts Changes Needed!

Your `next.config.ts` already has R2 configured:
```typescript
remotePatterns: [
  {
    protocol: 'https',
    hostname: '*.r2.cloudflarestorage.com',
    port: '',
    pathname: '/**',
  },
]
```

This already covers your R2 domain! ✅

### Step 8: Test Locally

```bash
# Make sure NEXT_PUBLIC_R2_URL is in .env.local
echo "NEXT_PUBLIC_R2_URL=https://pub-xxxxxx.r2.dev" >> .env.local

# Start dev server
npm run dev

# Visit http://localhost:3000
# Check that all 6 images load correctly
```

### Step 9: Delete Local Images

Once everything works:
```bash
rm "public/festival colour.jpg"
rm "public/festival original.jpg"
rm "public/grandfather colour.jpg"
rm "public/grandfather original.jpg"
rm "public/indian wedding colour.jpg"
rm "public/indian wedding original.jpg"
```

### Step 10: Deploy

```bash
git add .
git commit -m "Migrate static images to Cloudflare R2"
git push origin main
```

---

## Alternative: Use Custom Domain for R2

If you want even better performance and SEO, you can set up a custom domain:

### Setup Custom Domain on R2

1. Go to Cloudflare Dashboard → R2 → Your Bucket
2. Click **Settings** → **Custom Domains**
3. Click **Connect Domain**
4. Enter your subdomain: `cdn.yourdomain.com` or `images.yourdomain.com`
5. Cloudflare will automatically configure DNS

Then use:
```bash
NEXT_PUBLIC_R2_URL=https://cdn.yourdomain.com
```

**Benefits:**
- Branded URLs
- Better SEO
- More professional
- Same R2 performance

---

## Advantages of Using R2 vs Other CDNs

| Feature | Cloudflare R2 | Imgur | Cloudinary |
|---------|---------------|-------|------------|
| **Cost** | Free egress | Free | Free tier |
| **Already Setup** | ✅ Yes | ❌ No | ❌ No |
| **Config Needed** | ✅ None | Need config | Need config |
| **Bandwidth** | Unlimited | Unlimited | 25GB/month |
| **Control** | ✅ Full | ❌ Limited | ✅ Full |
| **Speed** | ✅ Fast | ✅ Fast | ✅ Fast |
| **Professional** | ✅ Yes | ❌ Not really | ✅ Yes |

---

## Expected Results

### Before Migration
- **Fast Origin Transfer:** 4.35 GB / 10 GB (43.5%)
- Static images served from Vercel

### After Migration
- **Fast Origin Transfer:** ~1.5 GB / 10 GB (15%)
- Static images served from R2 CDN
- **Savings:** ~3 GB monthly
- **Cost:** $0 (R2 has free egress)

---

## Troubleshooting

### Images not loading?

1. **Check R2 bucket is public:**
   - R2 Dashboard → Your Bucket → Settings
   - Ensure "Public Access" is enabled for R2.dev domain

2. **Check environment variable:**
   ```javascript
   // In browser console on your site
   console.log(process.env.NEXT_PUBLIC_R2_URL);
   ```

3. **Check image URLs directly:**
   - Visit: `https://pub-xxxxx.r2.dev/example-images/festival-colour.jpg`
   - Should load the image

4. **Check Vercel env vars:**
   - Ensure `NEXT_PUBLIC_R2_URL` is set in Vercel dashboard

### CORS Issues?

R2 automatically handles CORS for public buckets. If you have issues:

1. Go to R2 Dashboard → Your Bucket → Settings → CORS
2. Add CORS policy:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"]
  }
]
```

---

## File Organization Best Practices

Recommended R2 bucket structure:
```
your-bucket/
├── uploads/              # User-uploaded originals
│   └── [jobId]-original.jpg
├── outputs/              # Colorized results
│   └── [jobId]-colorized.jpg
└── static-assets/        # Static marketing images
    └── examples/
        ├── festival-colour.jpg
        ├── festival-original.jpg
        ├── grandfather-colour.jpg
        ├── grandfather-original.jpg
        ├── indian-wedding-colour.jpg
        └── indian-wedding-original.jpg
```

This keeps everything organized and separate.

---

## Next Steps

1. ✅ Upload 6 images to R2
2. ✅ Add `NEXT_PUBLIC_R2_URL` to `.env.local` and Vercel
3. ✅ Update `page.tsx` with R2 URLs
4. ✅ Test locally
5. ✅ Delete local images
6. ✅ Deploy to Vercel

**Total time:** 10-15 minutes
**Cost:** $0
**Savings:** ~3 GB monthly on Vercel

---

## Summary

**Use Cloudflare R2 because:**
- ✅ Already set up and working
- ✅ Zero additional configuration
- ✅ Free bandwidth
- ✅ Professional solution
- ✅ Same infrastructure as dynamic images
- ✅ Easy to manage in one place

This is the **BEST option** for your use case!

