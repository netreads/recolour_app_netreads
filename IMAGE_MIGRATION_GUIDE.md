# Image Migration Guide - Move to External CDN

## Why Migrate?
Moving your static example images from Vercel to an external CDN will **reduce Fast Origin Transfer by ~60-70%**, saving you ~3GB monthly.

## Current Images to Migrate (6 files)
```
/public/festival colour.jpg
/public/festival original.jpg
/public/grandfather colour.jpg
/public/grandfather original.jpg
/public/indian wedding colour.jpg
/public/indian wedding original.jpg
```

## Recommended CDN Options

### Option 1: Imgur (RECOMMENDED - Easiest)
- **Free**: Unlimited bandwidth
- **No account needed** for uploads
- **Simple**: Just drag & drop
- **Direct links**: Easy to use

**Steps:**
1. Go to https://imgur.com/upload
2. Upload all 6 images (drag & drop)
3. For each image, right-click → "Copy image address"
4. You'll get URLs like: `https://i.imgur.com/xxxxx.jpg`

### Option 2: Cloudinary (Best Features)
- **Free tier**: 25GB bandwidth/month
- **Image optimization**: Automatic WebP conversion
- **Transformations**: On-the-fly resizing
- **CDN**: Global edge network

**Steps:**
1. Sign up at https://cloudinary.com (free account)
2. Go to Media Library → Upload
3. Upload all 6 images
4. Get URLs like: `https://res.cloudinary.com/your-cloud/image/upload/v1234/image.jpg`

### Option 3: Google Drive (Already Using)
- **Free**: 15GB storage
- **You're already using it** for demo video
- **Keep everything in one place**

**Steps:**
1. Upload images to Google Drive
2. Right-click → Share → Get link
3. Change sharing to "Anyone with the link can view"
4. Get direct image URL format:
   ```
   https://drive.google.com/uc?id=FILE_ID
   ```

### Option 4: imgbb (Simple & Free)
- **Free**: Unlimited storage
- **No account needed**
- **Direct links**

**Steps:**
1. Go to https://imgbb.com/upload
2. Upload images one by one
3. Copy direct link for each

---

## Implementation Steps

### Step 1: Upload Images to CDN
Choose one of the options above and upload all 6 images. Keep track of the URLs.

### Step 2: Update next.config.ts
Add the CDN domain to allowed image domains:

```typescript
// next.config.ts
images: {
  domains: ['localhost'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.r2.cloudflarestorage.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'i.imgur.com', // If using Imgur
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com', // If using Cloudinary
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'drive.google.com', // If using Google Drive
      port: '',
      pathname: '/**',
    },
  ],
  formats: ['image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
},
```

### Step 3: Update page.tsx
Replace the local image paths with CDN URLs:

**Before:**
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

**After (Example with Imgur):**
```tsx
<Image
  src="https://i.imgur.com/ABC123.jpg"
  alt="Indian wedding photo before colorization"
  width={400}
  height={400}
  className="aspect-square object-cover w-full h-full"
  loading="lazy"
  quality={75}
/>
```

### Step 4: Update All 6 Image References
Update these lines in `src/app/page.tsx`:

```typescript
// Line ~730-731: Indian wedding original
<Image src="YOUR_CDN_URL_HERE" ... />

// Line ~744-748: Indian wedding colour
<Image src="YOUR_CDN_URL_HERE" ... />

// Line ~770-779: Grandfather original
<Image src="YOUR_CDN_URL_HERE" ... />

// Line ~784-793: Grandfather colour
<Image src="YOUR_CDN_URL_HERE" ... />

// Line ~811-820: Festival original
<Image src="YOUR_CDN_URL_HERE" ... />

// Line ~825-834: Festival colour
<Image src="YOUR_CDN_URL_HERE" ... />
```

### Step 5: Delete Local Images
After confirming everything works:

```bash
rm public/festival\ colour.jpg
rm public/festival\ original.jpg
rm public/grandfather\ colour.jpg
rm public/grandfather\ original.jpg
rm public/indian\ wedding\ colour.jpg
rm public/indian\ wedding\ original.jpg
```

### Step 6: Test & Deploy
```bash
# Test locally
npm run dev
# Visit http://localhost:3000
# Verify all images load correctly

# Deploy to Vercel
git add .
git commit -m "Optimize: Move static images to external CDN"
git push origin main
```

---

## Quick Copy-Paste Template

After uploading to your chosen CDN, create a mapping file:

```typescript
// image-urls.ts (temporary file for easy replacement)
const CDN_IMAGES = {
  'indian-wedding-original': 'https://YOUR_CDN/indian-wedding-original.jpg',
  'indian-wedding-colour': 'https://YOUR_CDN/indian-wedding-colour.jpg',
  'grandfather-original': 'https://YOUR_CDN/grandfather-original.jpg',
  'grandfather-colour': 'https://YOUR_CDN/grandfather-colour.jpg',
  'festival-original': 'https://YOUR_CDN/festival-original.jpg',
  'festival-colour': 'https://YOUR_CDN/festival-colour.jpg',
};
```

---

## Expected Results

### Before Migration
- Fast Origin Transfer: 4.35 GB / 10 GB (43.5%)
- Images served from Vercel Origin

### After Migration
- Fast Origin Transfer: ~1.5 GB / 10 GB (15%)
- Images served from external CDN
- **~3 GB monthly savings**
- Faster page loads (CDN edge caching)

---

## Verification Checklist

After migration, verify:
- ✅ All 6 images load on homepage
- ✅ Images display at correct quality
- ✅ No console errors
- ✅ Lighthouse score maintained/improved
- ✅ Mobile images load correctly
- ✅ Vercel Origin Transfer reduced

---

## Troubleshooting

### Images not loading?
1. Check browser console for errors
2. Verify CDN URLs are publicly accessible
3. Ensure `next.config.ts` includes the CDN domain
4. Clear browser cache and hard reload

### Image quality issues?
1. Upload original high-quality images to CDN
2. Don't use CDN's automatic compression (if available)
3. Let Next.js handle optimization via `quality` prop

### CORS errors?
- Most CDNs handle CORS automatically
- If using Google Drive, ensure sharing is set to "Anyone with link"

---

## Need Help?

If you encounter any issues:
1. Check the Next.js Image Optimization docs
2. Verify CDN documentation for direct linking
3. Test URLs in browser first before adding to code

---

## Rollback Plan

If something goes wrong:
1. Revert `page.tsx` to use local paths
2. Git revert: `git revert HEAD`
3. Redeploy: `git push origin main`

The local images will still be in git history until explicitly deleted and committed.

