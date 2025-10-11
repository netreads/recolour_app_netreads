# Deployment Checklist for Cost-Optimized Version

## Pre-Deployment

### 1. Configure R2 Public Access

**Critical Step - Without this, images won't load!**

Choose one of these options:

#### Option A: R2 Public Bucket (Easiest)
```bash
# 1. Go to Cloudflare Dashboard → R2 → Your Bucket
# 2. Settings → Public Access → Enable "Allow Access"
# 3. Copy the public URL (looks like: https://pub-xxxxx.r2.dev)
# 4. Add to Vercel environment variables
```

#### Option B: R2 Custom Domain (Professional)
```bash
# 1. Go to your R2 bucket → Settings → Custom Domains
# 2. Add domain: cdn.yourdomain.com
# 3. Set up DNS as instructed
# 4. Enable public access on the custom domain
```

### 2. Update Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add this NEW variable:**
```
NEXT_PUBLIC_R2_URL=https://your-r2-public-url
```

**Important:** 
- Include the bucket name if using direct R2 URL
- Example: `https://pub-xxxxx.r2.dev` or `https://cdn.yourdomain.com`
- No trailing slash

### 3. Verify Existing Variables

Ensure these are still configured:
- ✅ `DATABASE_URL`
- ✅ `R2_BUCKET`
- ✅ `R2_ACCESS_KEY_ID`
- ✅ `R2_SECRET_ACCESS_KEY`
- ✅ `R2_PUBLIC_URL` (internal use)
- ✅ `GEMINI_API_KEY`
- ✅ `PHONEPE_CLIENT_ID`
- ✅ `PHONEPE_CLIENT_SECRET`
- ✅ `NEXT_PUBLIC_APP_URL`

## Deployment Steps

### 1. Commit Changes
```bash
git add .
git commit -m "feat: optimize for reduced Vercel costs

- Remove image-proxy API route (serve images directly from R2)
- Disable Vercel Analytics and Speed Insights
- Add maxDuration to all API routes
- Increase image cache time to 1 year
- Update vercel.json configuration

Expected savings: 80-95% reduction in Vercel costs"
```

### 2. Push to Git
```bash
git push origin main
```

### 3. Vercel Auto-Deploy
Vercel will automatically deploy your changes.

## Post-Deployment Verification

### 1. Test Image Loading (Critical!)

1. Go to your deployed site
2. Open browser DevTools (F12) → Network tab
3. Upload a test image
4. **Verify:** Image URLs should point to R2, not `/api/image-proxy`
   - ✅ Good: `https://pub-xxxxx.r2.dev/uploads/...`
   - ❌ Bad: `https://yoursite.vercel.app/api/image-proxy?...`

### 2. Test Complete User Flow

- [ ] Homepage loads correctly
- [ ] Upload an image (free preview)
- [ ] Preview modal shows images
- [ ] Payment flow works
- [ ] Success page shows images
- [ ] Download HD image works
- [ ] No console errors

### 3. Check Function Invocations

1. Go to Vercel Dashboard → Your Project → Analytics
2. Monitor function invocations for 1-2 hours
3. **Expected:** Significant drop (70-90% reduction)
4. **Image views should NOT trigger functions anymore**

### 4. Verify Bandwidth Usage

1. Check Vercel Dashboard → Usage
2. Over 24-48 hours, bandwidth should decrease significantly
3. R2 serves images directly (free egress to Cloudflare CDN)

## Troubleshooting

### Issue: Images Not Loading

**Symptom:** Broken image links, 404 errors

**Solution:**
1. Check R2 bucket is set to public access
2. Verify `NEXT_PUBLIC_R2_URL` in Vercel environment variables
3. Check the URL format matches your R2 setup
4. Look for CORS errors in browser console
5. Redeploy to pick up new environment variables

### Issue: Still Using image-proxy

**Symptom:** Network tab shows `/api/image-proxy` URLs

**Solution:**
1. Verify `NEXT_PUBLIC_R2_URL` is set correctly
2. Clear browser cache (Ctrl+Shift+R)
3. Check Vercel logs for the env variable
4. Redeploy if needed

### Issue: CORS Errors

**Symptom:** Console shows "CORS policy" errors

**Solution:**
1. In Cloudflare R2 bucket settings → CORS Configuration:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Issue: Payment Flow Broken

**Symptom:** Payment not completing, images not unlocking

**Solution:**
1. Check PhonePe credentials are correct
2. Verify webhook URL is reachable
3. Check Vercel function logs for errors
4. Test payment in PhonePe sandbox first

## Performance Monitoring

### Week 1: Monitor Closely

Track these metrics daily:

1. **Vercel Dashboard:**
   - Function invocations (should drop 70-90%)
   - Bandwidth usage (should drop 80-95%)
   - Function execution time
   - Error rate

2. **User Experience:**
   - Page load speed (should be same or better)
   - Image load speed (should be faster)
   - Any user complaints

3. **R2 Dashboard:**
   - Storage usage
   - Request counts
   - Bandwidth usage (stays in free tier)

### Expected Metrics After Optimization

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Function Invocations/day | 10,000+ | 500-1,000 | -90% |
| Bandwidth/day | 50GB+ | 5-10GB | -80% |
| Avg Function Duration | 500ms | 300ms | -40% |
| Image Load Time | 800ms | 200ms | -75% |

## Cost Tracking

### Set Up Spending Alerts

1. Go to Vercel Dashboard → Settings → Billing
2. Set spending limit alerts:
   - Warning at $20
   - Warning at $50
   - Hard limit at $100 (optional)

### Compare Costs

After 1 full billing cycle:

**Before Optimization:** $______

**After Optimization:** $______

**Savings:** $______ (_____%)

**Target:** 80-95% reduction

## Rollback Plan

If something goes wrong and you need to rollback:

### Quick Rollback
```bash
git revert HEAD
git push origin main
```

### Manual Rollback
1. Re-create `/api/image-proxy/route.ts` from git history
2. Update `page.tsx` to use image-proxy
3. Update `payment/success/page.tsx` to use image-proxy
4. Uncomment Analytics in `layout.tsx`
5. Redeploy

## Success Criteria

✅ Deployment is successful if:

1. ✅ All user flows work correctly
2. ✅ Images load from R2 directly (not via API)
3. ✅ Function invocations reduced by 70-90%
4. ✅ Bandwidth reduced by 80-95%
5. ✅ No increase in errors
6. ✅ Page load speed same or better
7. ✅ Vercel bill projection shows significant savings

## Next Steps After Successful Deployment

1. **Monitor for 1 week** - Watch metrics daily
2. **Review first month's bill** - Confirm 80-95% savings
3. **Consider further optimizations:**
   - Implement ISR for homepage
   - Add Redis caching for API responses
   - Optimize database queries
   - Consider moving to Edge Runtime where appropriate

## Support & Documentation

- **Cost Optimization Guide:** `COST_OPTIMIZATION_GUIDE.md`
- **Vercel Docs:** https://vercel.com/docs
- **R2 Docs:** https://developers.cloudflare.com/r2/
- **Next.js Docs:** https://nextjs.org/docs

## Emergency Contacts

If critical issues arise:
- Vercel Support: https://vercel.com/support
- Cloudflare Support: https://dash.cloudflare.com/
- Check function logs immediately
- Consider temporary rollback

---

**Last Updated:** 2025-10-11  
**Version:** 1.0  
**Status:** Ready for deployment

