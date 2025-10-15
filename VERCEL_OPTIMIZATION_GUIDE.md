# Vercel Free Tier Optimization Guide

## Current Usage Analysis (As of Oct 15, 2025)

| Metric | Usage | Percentage | Priority |
|--------|-------|------------|----------|
| Fast Origin Transfer | 4.35 GB / 10 GB | 43.5% | 🔴 HIGH |
| Speed Insights | 2.7K / 10K | 27% | ✅ Disabled |
| Active CPU | 49m 6s / 4h | 20.4% | 🟡 MEDIUM |
| Data Transfer | 9.78 GB / 100 GB | 9.78% | 🟢 LOW |
| Edge Requests | 63K / 1M | 6.3% | 🟢 LOW |
| Function Invocations | 45K / 1M | 4.5% | 🟢 LOW |

## Optimization Recommendations

### 🔴 PRIORITY 1: Reduce Origin Transfer (43.5% → ~15%)

**Issue:** Static images in `/public` folder are being served from Vercel Origin
**Impact:** ~3-4 GB saved monthly

#### Solution 1: Move Static Images to External CDN (RECOMMENDED)
Move the 6 before/after example images to:
- **Imgur** (Free, unlimited bandwidth)
- **Cloudinary** (Free tier: 25GB/month)
- **Google Drive** (Already using for demo video)
- **imgbb** (Free image hosting)

**Files to move:**
```
/public/festival colour.jpg
/public/festival original.jpg
/public/grandfather colour.jpg
/public/grandfather original.jpg
/public/indian wedding colour.jpg
/public/indian wedding original.jpg
```

**Implementation:**
1. Upload images to Imgur/Cloudinary
2. Update `src/app/page.tsx` lines 730-848 with external URLs
3. Remove files from `/public` folder
4. Update `next.config.ts` to allow external domains

**Expected Savings:** 60-70% reduction in Origin Transfer

---

### 🟡 PRIORITY 2: Optimize Tracking Scripts (Reduce CPU 20% → ~10%)

**Issue:** Facebook Pixel & Microsoft Clarity use `beforeInteractive` strategy
**Impact:** Increases CPU time and blocks page load

#### Solution: Lazy Load Non-Critical Tracking
```typescript
// Change from beforeInteractive to afterInteractive or lazyOnload
strategy="afterInteractive"  // For Facebook Pixel (user behavior tracking)
strategy="lazyOnload"        // For Microsoft Clarity (session recording)
```

**Files to update:**
- `src/components/FacebookPixel.tsx` - line 29
- `src/components/MicrosoftClarity.tsx` - line 20

**Expected Savings:** 40-50% reduction in Active CPU time

---

### 🟢 PRIORITY 3: Optimize API Routes & Caching

#### 3.1 Add API Route Caching
**File:** `vercel.json`
```json
{
  "headers": [
    {
      "source": "/api/get-image-url/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=3600, stale-while-revalidate=7200"
        }
      ]
    }
  ]
}
```

#### 3.2 Enable ISR for Static Pages
**Files to update:** FAQ, Privacy, ToS, Contact, Refund, Cookies pages
```typescript
export const revalidate = 3600; // Revalidate every hour
```

---

### 🟢 PRIORITY 4: Remove Unused Dependencies

**Current unused/redundant packages:**
```bash
@vercel/analytics (already disabled but still in package.json)
@vercel/speed-insights (already disabled but still in package.json)
```

**Action:**
```bash
npm uninstall @vercel/analytics @vercel/speed-insights
```

**Expected Savings:** ~200KB bundle size reduction

---

### 🟢 PRIORITY 5: Image Optimization Enhancements

#### 5.1 Add Blur Placeholders
Update example images in `page.tsx` to include blur data URLs:
```typescript
placeholder="blur"
blurDataURL="data:image/jpeg;base64,..." // 20-30 byte placeholder
```

#### 5.2 Optimize Quality Setting
Change `quality={85}` to `quality={75}` for example images (lines 737, 751, 779, 793, 819, 833)

**Expected Savings:** 20-30% reduction in image transfer size

---

### 🟢 PRIORITY 6: Bundle Size Optimization

#### 6.1 Dynamic Imports for Heavy Components
```typescript
// In page.tsx - lazy load modals and heavy components
const PaymentModal = dynamic(() => import('./PaymentModal'), { ssr: false });
```

#### 6.2 Reduce Lucide Icons Bundle
Currently importing 12+ icons. Use tree-shaking optimization:
```typescript
// Instead of importing from 'lucide-react'
import Zap from 'lucide-react/dist/esm/icons/zap';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
```

---

## Implementation Priority Order

### Week 1 (Immediate Impact)
1. ✅ Move static images to Imgur/Cloudinary
2. ✅ Change tracking script strategy to `afterInteractive`
3. ✅ Remove unused @vercel packages

**Expected Impact:** 65-70% reduction in Origin Transfer, 40% reduction in CPU

### Week 2 (Fine-tuning)
4. ✅ Add ISR to static pages
5. ✅ Optimize image quality settings
6. ✅ Add API caching headers

**Expected Impact:** Additional 10-15% overall reduction

### Week 3 (Polish)
7. ✅ Implement dynamic imports
8. ✅ Add blur placeholders
9. ✅ Optimize icon imports

**Expected Impact:** Additional 5-10% bundle size reduction

---

## Monitoring & Testing

### Before Implementation
```bash
# Measure current bundle size
npm run build
# Check .next/analyze output

# Lighthouse performance score
npx lighthouse https://your-domain.vercel.app --view
```

### After Each Change
```bash
# Verify bundle reduction
npm run build

# Check Vercel Analytics
# Monitor: Origin Transfer, CPU time, Function Duration
```

---

## Expected Final Results

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Fast Origin Transfer | 4.35 GB | ~1.5 GB | ~65% ⬇️ |
| Active CPU | 49m | ~25m | ~50% ⬇️ |
| Data Transfer | 9.78 GB | ~7 GB | ~28% ⬇️ |
| Bundle Size | Current | -15-20% | Faster loads |

---

## Emergency Measures (If Close to Limit)

### If Origin Transfer > 90%
1. Temporarily disable example images section
2. Move all `/public` assets to external CDN
3. Use Cloudflare CDN in front of Vercel

### If CPU > 90%
1. Disable Microsoft Clarity temporarily
2. Reduce Facebook Pixel tracking events
3. Implement client-side caching

### If Function Invocations > 90%
1. Add aggressive caching to API routes
2. Implement request deduplication
3. Use Vercel Edge Functions for simple routes

---

## Long-term Solutions

### Consider Upgrading If:
- Consistent usage > 80% for 3+ months
- Business revenue supports Pro tier ($20/month)
- Need higher limits for growth

### Alternative Platforms:
- **Cloudflare Pages** (Generous free tier, unlimited bandwidth)
- **Netlify** (100GB bandwidth/month free)
- **Railway** (Different pricing model)

---

## Notes

- All optimizations maintain **full functionality**
- **Zero impact on user experience**
- **No feature removal** required
- Progressive implementation over 3 weeks
- Monitoring at each stage

