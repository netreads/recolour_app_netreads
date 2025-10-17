# Implementation Checklist: Cost Optimization

**Goal:** Reduce Vercel & Cloudflare R2 costs by 70-80%  
**Timeline:** Phase 1 (Weekend) → Phase 2 (Week) → Phase 3 (Ongoing)  
**Current Cost:** ~$78-120/month → **Target:** ~$15-30/month

---

## 📋 PHASE 1: QUICK WINS (4-6 Hours, 40% Savings)

### ✅ Task 1: Return Direct R2 URLs (90 minutes)
**Savings:** $5-10/month | **Risk:** Low

- [ ] **Step 1:** Update `src/lib/utils.ts`
  ```typescript
  // Replace getDirectImageUrl function
  export function getDirectImageUrl(jobId: string, type: 'original' | 'output', fileName?: string): string {
    const R2_URL = process.env.NEXT_PUBLIC_R2_URL!;
    const path = type === 'original' 
      ? `uploads/${jobId}${fileName ? '-' + fileName : ''}`
      : `outputs/${jobId}-colorized.jpg`;
    return `${R2_URL}/${path}`;
  }
  ```

- [ ] **Step 2:** Update `src/app/api/upload-via-presigned/route.ts`
  ```typescript
  // Line 98-105: Return full URLs in response
  return NextResponse.json({
    success: true,
    jobId,
    originalUrl,      // Already has full R2 URL
    uploadUrl: signedUpload.url,
    fileKey,
    // Add these for direct client use:
    outputUrl: `${env.R2_PUBLIC_URL}/outputs/${jobId}-colorized.jpg`,
  });
  ```

- [ ] **Step 3:** Update `src/app/api/submit-job/route.ts`
  ```typescript
  // Line 213-219: Return full R2 URLs
  return NextResponse.json({
    success: true,
    jobId,
    outputUrl,        // Already has full R2 URL
    originalUrl: job.originalUrl,  // Already has full R2 URL
    status: 'done',
  });
  ```

- [ ] **Step 4:** Update `src/app/page.tsx`
  ```typescript
  // Line 58-69: Use URLs directly from state
  const getImageUrl = (jobId: string, type: 'original' | 'output'): string => {
    if (currentJob && currentJob.id === jobId) {
      if (type === 'original' && currentJob.original_url) {
        return currentJob.original_url;
      }
      if (type === 'output' && currentJob.output_url) {
        return currentJob.output_url;
      }
    }
    // Fallback only if URLs not in state
    return getDirectImageUrl(jobId, type);
  };
  ```

- [ ] **Step 5:** Test locally
  ```bash
  npm run dev
  # Upload an image
  # Verify preview loads images directly from R2
  # Check Network tab - should see NO calls to /api/get-image-url
  ```

- [ ] **Step 6:** Optional - Delete unused API route
  ```bash
  rm src/app/api/get-image-url/route.ts
  ```

**Expected Result:** Images load directly from R2 URLs, no API middleman

---

### ✅ Task 2: Add Static Generation (60 minutes)
**Savings:** $3-8/month | **Risk:** Low

- [ ] **Step 1:** Add static generation to homepage
  ```typescript
  // src/app/page.tsx - Add at top (line 35)
  export const dynamic = 'force-static';
  export const revalidate = 3600; // Revalidate every hour
  ```

- [ ] **Step 2:** Add static generation to policy pages
  ```typescript
  // src/app/faq/page.tsx
  export const dynamic = 'force-static';
  export const revalidate = 86400; // Daily
  
  // Repeat for:
  // - src/app/privacy/page.tsx
  // - src/app/tos/page.tsx
  // - src/app/contact/page.tsx
  // - src/app/refund/page.tsx
  // - src/app/cookies/page.tsx
  ```

- [ ] **Step 3:** Update `next.config.ts` to enable static optimization
  ```typescript
  const nextConfig: NextConfig = {
    // ... existing config ...
    
    // Add output configuration
    output: 'standalone',
    
    // Optimize static generation
    experimental: {
      optimizePackageImports: ['lucide-react'],
      // Enable PPR for hybrid static/dynamic
      ppr: 'incremental',
    },
  };
  ```

- [ ] **Step 4:** Build and verify static pages
  ```bash
  npm run build
  # Look for output:
  # ○ / (ISR: 3600s)
  # ○ /faq (ISR: 86400s)
  # ● /api/submit-job (Dynamic)
  ```

- [ ] **Step 5:** Deploy to Vercel
  ```bash
  git add -A
  git commit -m "feat: add static generation for cost savings"
  git push origin main
  ```

**Expected Result:** Homepage and policy pages served from edge CDN (free)

---

### ✅ Task 3: Optimize Middleware (30 minutes)
**Savings:** $2-5/month | **Risk:** Very Low

- [ ] **Step 1:** Update `src/middleware.ts`
  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { getSecurityHeaders } from '@/lib/security'

  export async function middleware(request: NextRequest) {
    const response = NextResponse.next()
    
    // Add security headers to critical routes only
    const securityHeaders = getSecurityHeaders()
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }

  export const config = {
    matcher: [
      // Only run on API routes that need security
      '/api/submit-job',
      '/api/upload-via-presigned',
      '/api/download-image',
      '/api/payments/:path*',
      '/api/admin/:path*',
      // Payment pages
      '/payment/:path*',
    ],
  };
  ```

- [ ] **Step 2:** Test that security headers still work
  ```bash
  curl -I https://yourapp.com/api/submit-job
  # Should see X-Frame-Options, X-Content-Type-Options, etc.
  ```

- [ ] **Step 3:** Verify static assets don't trigger middleware
  ```bash
  # Open DevTools → Network
  # Reload page
  # Check that .css, .js, .png don't have custom headers
  ```

**Expected Result:** Middleware runs only on critical routes (80% fewer invocations)

---

### ✅ Task 4: Add Lazy Loading to Images (15 minutes)
**Savings:** $1-2/month | **Risk:** Very Low

- [ ] **Step 1:** Update example images in `src/app/page.tsx`
  ```typescript
  // Line 718-739 (first example image)
  <img
    src="https://pub-a16f47f2729e4df8b1e83fdf9703d1ca.r2.dev/example-images/indian%20wedding%20original.jpg"
    alt="Indian wedding photo before colorization"
    width={400}
    height={400}
    className="aspect-square object-cover w-full h-full"
    loading="lazy"  // ADD THIS
    decoding="async"  // ADD THIS
  />
  
  // Repeat for all 6 example images (lines 718-834)
  ```

- [ ] **Step 2:** Add lazy loading to demo video
  ```typescript
  // Line 850
  <video
    src="https://pub-a16f47f2729e4df8b1e83fdf9703d1ca.r2.dev/example-images/demo_video_recolorAI.mp4"
    // ... existing props ...
    loading="lazy"  // ADD THIS
    preload="metadata"  // Already there
  >
  ```

- [ ] **Step 3:** Test on mobile (where it matters most)
  ```bash
  # Open DevTools → Network
  # Scroll slowly down the page
  # Verify images load only when scrolled into view
  ```

**Expected Result:** Images load on-demand (50% fewer R2 reads for bounced users)

---

### ✅ Task 5: Add Image Cleanup Cron Job (90 minutes)
**Savings:** 50-70% storage costs over time | **Risk:** Medium

- [ ] **Step 1:** Create cron route file
  ```bash
  mkdir -p src/app/api/cron
  touch src/app/api/cron/cleanup-images/route.ts
  ```

- [ ] **Step 2:** Add cleanup logic
  ```typescript
  // src/app/api/cron/cleanup-images/route.ts
  import { NextRequest, NextResponse } from 'next/server';
  import { prisma } from '@/lib/db';
  import { AwsClient } from 'aws4fetch';
  import { getServerEnv } from '@/lib/env';

  export const dynamic = 'force-dynamic';
  export const maxDuration = 60;

  export async function GET(request: NextRequest) {
    const env = getServerEnv();
    
    // Verify cron secret (Vercel Cron authentication)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      // Delete unpaid images older than 7 days
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const unpaidJobs = await prisma.job.findMany({
        where: {
          isPaid: false,
          createdAt: { lt: cutoffDate },
        },
        take: 100, // Process in batches to avoid timeout
      });
      
      if (unpaidJobs.length === 0) {
        return NextResponse.json({ 
          success: true, 
          deleted: 0,
          message: 'No old unpaid images to clean up' 
        });
      }
      
      const r2Client = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        region: 'auto',
        service: 's3',
      });
      
      let deleted = 0;
      const errors: string[] = [];
      
      for (const job of unpaidJobs) {
        try {
          // Extract file key from URL
          const originalKey = job.originalUrl.split('/').slice(-2).join('/');
          
          // Delete original from R2
          const accountId = env.R2_ACCOUNT_ID;
          const deleteOriginalUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${originalKey}`;
          
          const deleteOriginal = await r2Client.fetch(deleteOriginalUrl, {
            method: 'DELETE',
          });
          
          if (!deleteOriginal.ok && deleteOriginal.status !== 404) {
            throw new Error(`Failed to delete original: ${deleteOriginal.status}`);
          }
          
          // Delete output if exists
          if (job.outputUrl) {
            const outputKey = job.outputUrl.split('/').slice(-2).join('/');
            const deleteOutputUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${outputKey}`;
            
            const deleteOutput = await r2Client.fetch(deleteOutputUrl, {
              method: 'DELETE',
            });
            
            if (!deleteOutput.ok && deleteOutput.status !== 404) {
              throw new Error(`Failed to delete output: ${deleteOutput.status}`);
            }
          }
          
          // Delete from database
          await prisma.job.delete({ 
            where: { id: job.id } 
          });
          
          deleted++;
        } catch (err) {
          const errorMsg = `Failed to delete job ${job.id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      return NextResponse.json({
        success: true,
        deleted,
        total: unpaidJobs.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Cleaned up ${deleted}/${unpaidJobs.length} unpaid images older than 7 days`,
      });
      
    } catch (error) {
      console.error('Cleanup error:', error);
      return NextResponse.json(
        { 
          error: 'Cleanup failed', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        },
        { status: 500 }
      );
    }
  }
  ```

- [ ] **Step 3:** Add CRON_SECRET to environment variables
  ```bash
  # Generate a secure random string
  openssl rand -base64 32
  
  # Add to Vercel dashboard:
  # Settings → Environment Variables → Add:
  CRON_SECRET=your-generated-secret-here
  ```

- [ ] **Step 4:** Update `vercel.json` to schedule cron job
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/cleanup-images",
        "schedule": "0 2 * * *"
      }
    ],
    "headers": [ /* existing headers */ ]
  }
  ```

- [ ] **Step 5:** Update `.env.local` for local testing
  ```env
  CRON_SECRET=your-test-secret
  ```

- [ ] **Step 6:** Test locally
  ```bash
  # Terminal 1
  npm run dev
  
  # Terminal 2
  curl -H "Authorization: Bearer your-test-secret" \
       http://localhost:3000/api/cron/cleanup-images
  
  # Should see: {"success": true, "deleted": 0, ...}
  ```

- [ ] **Step 7:** Deploy and verify cron setup
  ```bash
  git add -A
  git commit -m "feat: add automated cleanup of unpaid images"
  git push origin main
  
  # Verify in Vercel Dashboard:
  # Project → Cron Jobs → Should see "cleanup-images" listed
  ```

- [ ] **Step 8:** Manually trigger first run (optional)
  ```bash
  # In Vercel Dashboard, find cron job and click "Run Now"
  # Or use Vercel CLI:
  vercel env pull .env.production
  curl -H "Authorization: Bearer $(grep CRON_SECRET .env.production | cut -d= -f2)" \
       https://yourapp.com/api/cron/cleanup-images
  ```

**Expected Result:** Unpaid images automatically deleted after 7 days

---

### 📊 Phase 1 Checkpoint
- [ ] **Verify savings in Vercel Dashboard**
  - Go to Usage tab
  - Compare "Function Invocations" week-over-week
  - Should see 30-40% reduction

- [ ] **Test critical paths**
  - [ ] Upload image → works
  - [ ] Submit job → works
  - [ ] View preview → images load directly from R2
  - [ ] Make payment → works
  - [ ] Download image → works

- [ ] **Monitor for 1 week before Phase 2**

**🎉 Estimated Savings After Phase 1: $20-35/month (40%)**

---

## 🚀 PHASE 2: MAJOR REFACTOR (3-5 Days, 60% Savings)

### ✅ Task 6: Set Up Cloudflare Workers (2 hours)
**Savings:** $10-15/month | **Risk:** Medium

- [ ] **Step 1:** Install Wrangler CLI
  ```bash
  npm install -g wrangler
  wrangler --version
  ```

- [ ] **Step 2:** Login to Cloudflare
  ```bash
  wrangler login
  ```

- [ ] **Step 3:** Create Worker project
  ```bash
  mkdir cloudflare-worker
  cd cloudflare-worker
  wrangler init image-processor
  # Choose: TypeScript, Yes for git, No for deploy
  ```

- [ ] **Step 4:** Configure Worker
  ```toml
  # cloudflare-worker/wrangler.toml
  name = "image-processor"
  main = "src/index.ts"
  compatibility_date = "2024-01-01"

  # Bind to R2 bucket
  [[r2_buckets]]
  binding = "R2_BUCKET"
  bucket_name = "your-bucket-name"

  [env.production]
  vars = { ENVIRONMENT = "production" }
  
  # Add secrets via: wrangler secret put GEMINI_API_KEY
  ```

- [ ] **Step 5:** Create Worker code
  ```typescript
  // cloudflare-worker/src/index.ts
  interface Env {
    R2_BUCKET: R2Bucket;
    GEMINI_API_KEY: string;
    DATABASE_URL: string;
  }

  export default {
    async fetch(request: Request, env: Env): Promise<Response> {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      const { jobId } = await request.json() as { jobId: string };
      
      try {
        // 1. Get job from database
        const jobResponse = await fetch(`https://yourapp.com/api/internal/get-job/${jobId}`, {
          headers: { 'Authorization': `Bearer ${env.INTERNAL_API_KEY}` },
        });
        const job = await jobResponse.json();

        // 2. Download image from R2
        const fileKey = new URL(job.originalUrl).pathname.slice(1);
        const imageObject = await env.R2_BUCKET.get(fileKey);
        
        if (!imageObject) {
          throw new Error('Image not found in R2');
        }

        const imageBuffer = await imageObject.arrayBuffer();
        const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

        // 3. Call Gemini API (same logic as current submit-job)
        const prompt = "Fully restore and colorize the provided image...";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${env.GEMINI_API_KEY}`;
        
        const geminiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
              ]
            }],
            generationConfig: {
              temperature: 1.0,
              topP: 0.95,
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        });

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        const result = await geminiResponse.json();
        const processedImageData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!processedImageData) {
          throw new Error('No image generated');
        }

        // 4. Upload to R2
        const outputKey = `outputs/${jobId}-colorized.jpg`;
        const processedBuffer = Uint8Array.from(atob(processedImageData), c => c.charCodeAt(0));
        
        await env.R2_BUCKET.put(outputKey, processedBuffer, {
          httpMetadata: { contentType: 'image/jpeg' },
        });

        // 5. Update job status in database
        await fetch(`https://yourapp.com/api/internal/update-job/${jobId}`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${env.INTERNAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'DONE',
            outputUrl: `https://yourapp.com/outputs/${outputKey}`,
          }),
        });

        return Response.json({
          success: true,
          jobId,
          status: 'DONE',
        });

      } catch (error) {
        console.error('Worker error:', error);
        
        // Mark job as failed
        await fetch(`https://yourapp.com/api/internal/update-job/${jobId}`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${env.INTERNAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'FAILED' }),
        });

        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }
    },
  };
  ```

- [ ] **Step 6:** Add secrets to Worker
  ```bash
  cd cloudflare-worker
  wrangler secret put GEMINI_API_KEY
  # Paste your Gemini API key
  
  wrangler secret put INTERNAL_API_KEY
  # Generate: openssl rand -base64 32
  ```

- [ ] **Step 7:** Deploy Worker
  ```bash
  wrangler deploy
  # Note the Worker URL: https://image-processor.your-subdomain.workers.dev
  ```

**Expected Result:** Worker deployed and ready to process images

---

### ✅ Task 7: Update Vercel API to Use Worker (90 minutes)
**Savings:** $10-15/month | **Risk:** Medium

- [ ] **Step 1:** Create internal API routes for Worker
  ```typescript
  // src/app/api/internal/get-job/[jobId]/route.ts
  import { NextRequest, NextResponse } from 'next/server';
  import { prisma } from '@/lib/db';
  import { getServerEnv } from '@/lib/env';

  export const dynamic = 'force-dynamic';

  export async function GET(
    request: NextRequest,
    { params }: { params: { jobId: string } }
  ) {
    const env = getServerEnv();
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${env.INTERNAL_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  }
  ```

  ```typescript
  // src/app/api/internal/update-job/[jobId]/route.ts
  import { NextRequest, NextResponse } from 'next/server';
  import { prisma } from '@/lib/db';
  import { getServerEnv } from '@/lib/env';

  export const dynamic = 'force-dynamic';

  export async function POST(
    request: NextRequest,
    { params }: { params: { jobId: string } }
  ) {
    const env = getServerEnv();
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${env.INTERNAL_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    
    const job = await prisma.job.update({
      where: { id: params.jobId },
      data: updates,
    });

    return NextResponse.json(job);
  }
  ```

- [ ] **Step 2:** Rename `submit-job` to `queue-job`
  ```bash
  mv src/app/api/submit-job src/app/api/queue-job
  ```

- [ ] **Step 3:** Simplify queue-job logic
  ```typescript
  // src/app/api/queue-job/route.ts
  import { NextRequest, NextResponse } from "next/server";
  import { getDatabase } from "@/lib/db";
  import { getServerEnv } from "@/lib/env";
  import { JOB_STATUS } from "@/lib/constants";

  export const runtime = 'nodejs';
  export const maxDuration = 10; // Down from 45s!

  export async function POST(request: NextRequest) {
    try {
      const db = getDatabase();
      const env = getServerEnv();

      const { jobId } = await request.json();
      
      if (!jobId || typeof jobId !== 'string') {
        return NextResponse.json({ error: "Valid Job ID is required" }, { status: 400 });
      }

      // Get job from database
      const job = await db.getJobById(jobId);

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      if (job.status !== JOB_STATUS.PENDING) {
        return NextResponse.json({ error: "Job already processed" }, { status: 400 });
      }

      // Update job status to processing
      await db.updateJob(jobId, { status: JOB_STATUS.PROCESSING });

      // Trigger Cloudflare Worker (async - don't wait)
      fetch(env.CLOUDFLARE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      }).catch(err => {
        console.error('Failed to trigger worker:', err);
        // Worker will retry via cron if this fails
      });

      // Return immediately - user will poll for status
      return NextResponse.json({
        success: true,
        jobId,
        status: 'processing',
        message: 'Image is being processed. Check status in a few seconds.',
      });

    } catch (error) {
      const env = getServerEnv();
      if (env.NODE_ENV === 'development') {
        console.error("Error queuing job:", error);
      }
      return NextResponse.json(
        { error: "Failed to queue job" },
        { status: 500 }
      );
    }
  }
  ```

- [ ] **Step 4:** Create job status polling API
  ```typescript
  // src/app/api/job-status/[jobId]/route.ts
  import { NextRequest, NextResponse } from 'next/server';
  import { prisma } from '@/lib/db';

  export const dynamic = 'force-dynamic';
  export const maxDuration = 5;

  export async function GET(
    request: NextRequest,
    { params }: { params: { jobId: string } }
  ) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: params.jobId },
        select: {
          id: true,
          status: true,
          originalUrl: true,
          outputUrl: true,
          createdAt: true,
        },
      });

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(job, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    } catch (error) {
      console.error('Status check error:', error);
      return NextResponse.json(
        { error: 'Failed to check status' },
        { status: 500 }
      );
    }
  }
  ```

- [ ] **Step 5:** Update frontend to poll for status
  ```typescript
  // src/app/page.tsx - Update handleFileUpload function
  
  // After line 150 (where submit-job is called)
  const submitResponse = await fetch("/api/queue-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  });

  if (!submitResponse.ok) {
    throw new Error("Failed to queue job");
  }

  const submitData = await submitResponse.json();
  
  // Poll for completion
  let attempts = 0;
  const maxAttempts = 30; // 30 attempts × 2s = 60s max wait
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
    
    const statusResponse = await fetch(`/api/job-status/${jobId}`);
    const statusData = await statusResponse.json();
    
    if (statusData.status === 'DONE') {
      // Update progress to 100%
      clearInterval(colorizingInterval);
      setUploadProgress(85);
      
      // Show finalizing stage
      setUploadStage('finalizing');
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(100);
      
      // Set job data
      const newJob: Job = {
        id: jobId,
        original_url: statusData.originalUrl,
        output_url: statusData.outputUrl,
        status: 'done',
        created_at: statusData.createdAt,
        isPaid: false,
      };
      
      setCurrentJob(newJob);
      setShowPaymentModal(true);
      break;
    } else if (statusData.status === 'FAILED') {
      throw new Error('Image processing failed');
    }
    
    attempts++;
    
    // Update progress bar (simulate progress)
    setUploadProgress(prev => Math.min(prev + 1, 85));
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Processing timeout - please try again');
  }
  ```

- [ ] **Step 6:** Add environment variables
  ```bash
  # Vercel Dashboard → Environment Variables
  CLOUDFLARE_WORKER_URL=https://image-processor.your-subdomain.workers.dev
  INTERNAL_API_KEY=your-generated-key
  ```

- [ ] **Step 7:** Test end-to-end
  ```bash
  npm run dev
  # Upload image
  # Should queue instantly
  # Should poll and complete within 10-30s
  # Preview should show result
  ```

**Expected Result:** Image processing happens in Worker (not Vercel), API returns instantly

---

### ✅ Task 8: Set Up Cloudflare CDN for R2 (45 minutes)
**Savings:** $1-3/month + Faster performance | **Risk:** Low

- [ ] **Step 1:** Add custom domain to R2 bucket
  ```bash
  # In Cloudflare Dashboard:
  # R2 → Your Bucket → Settings → Custom Domains
  # Add: images.yourapp.com
  ```

- [ ] **Step 2:** Create DNS record
  ```bash
  # DNS → Add Record:
  # Type: CNAME
  # Name: images
  # Target: (auto-filled by R2)
  # Proxy: Enabled (orange cloud)
  ```

- [ ] **Step 3:** Configure cache rules
  ```bash
  # Cloudflare Dashboard → Caching → Cache Rules
  # Create rule:
  # Name: R2 Images Cache
  # When: Hostname equals images.yourapp.com
  # Then: Cache Everything
  # Edge TTL: 1 year
  # Browser TTL: 1 year
  ```

- [ ] **Step 4:** Update environment variables
  ```env
  # .env.local and Vercel
  NEXT_PUBLIC_R2_URL=https://images.yourapp.com
  R2_PUBLIC_URL=https://images.yourapp.com
  ```

- [ ] **Step 5:** Deploy changes
  ```bash
  git add -A
  git commit -m "feat: use Cloudflare CDN for R2 images"
  git push origin main
  ```

- [ ] **Step 6:** Test CDN caching
  ```bash
  # First request
  curl -I https://images.yourapp.com/uploads/test.jpg
  # Should see: cf-cache-status: MISS
  
  # Second request
  curl -I https://images.yourapp.com/uploads/test.jpg
  # Should see: cf-cache-status: HIT
  ```

**Expected Result:** Images served from Cloudflare CDN (90% cache hit rate)

---

### ✅ Task 9: Add Worker Fallback (30 minutes)
**Savings:** N/A | **Risk Mitigation:** High

- [ ] **Step 1:** Keep old submit-job as fallback
  ```bash
  mv src/app/api/submit-job src/app/api/submit-job-fallback
  ```

- [ ] **Step 2:** Update queue-job to use fallback on Worker failure
  ```typescript
  // src/app/api/queue-job/route.ts
  
  // After triggering worker:
  fetch(env.CLOUDFLARE_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  }).catch(async err => {
    console.error('Worker failed, using fallback:', err);
    
    // Fallback to Vercel processing
    try {
      await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/submit-job-fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr);
    }
  });
  ```

**Expected Result:** System works even if Worker is down

---

### 📊 Phase 2 Checkpoint
- [ ] **Verify Worker is processing images**
  - Check Cloudflare Workers dashboard
  - Should see requests and success rate

- [ ] **Verify CDN is caching**
  - Check Cloudflare Analytics
  - Should see 80-90% cache hit rate

- [ ] **Verify Vercel costs dropping**
  - Check Function Duration metric
  - Should see 80% reduction

- [ ] **Test failure scenarios**
  - [ ] Worker down → Fallback works
  - [ ] Gemini API error → Job marked failed
  - [ ] R2 down → Graceful error

**🎉 Estimated Total Savings After Phase 2: $35-50/month (60%)**

---

## 🔬 PHASE 3: POLISH & MONITOR (Ongoing)

### ✅ Task 10: Set Up Cost Monitoring (1 hour)

- [ ] **Create cost tracking dashboard**
  ```typescript
  // src/app/admin/costs/page.tsx
  export default function CostsPage() {
    return (
      <div>
        <h1>Monthly Costs</h1>
        <ul>
          <li>Vercel: Check dashboard</li>
          <li>Cloudflare R2: Check dashboard</li>
          <li>PostgreSQL: $20/month</li>
        </ul>
      </div>
    );
  }
  ```

- [ ] **Set up Vercel spending alerts**
  - Dashboard → Usage → Spending Limit → $50/month

- [ ] **Monitor weekly**
  - Every Monday: Check Vercel Usage tab
  - Every Monday: Check Cloudflare Analytics

**Expected Result:** Proactive cost management

---

### ✅ Task 11: Optimize Gemini API Usage (2 hours)
**Savings:** 10-20% on processing costs

- [ ] **Resize images before sending**
  ```bash
  npm install sharp
  ```

  ```typescript
  // In Cloudflare Worker or submit-job-fallback
  import sharp from 'sharp';
  
  const resizedBuffer = await sharp(imageBuffer)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
  ```

- [ ] **Cache common results** (optional)
  - Use image hash as cache key
  - Store in Redis or Cloudflare KV

**Expected Result:** Faster processing + lower Gemini API costs

---

### ✅ Task 12: Add Redis Caching for Payment Status (1 hour)
**Savings:** $0.50-1/month

- [ ] **Set up Redis** (Vercel KV or Upstash)
- [ ] **Cache paid job IDs**
- [ ] **Update download-image to check cache first**

**Expected Result:** Fewer database queries

---

## 📈 FINAL COST COMPARISON

### Before Optimization
| Service | Cost/Month |
|---------|-----------|
| Vercel Functions | $45-80 |
| Vercel Bandwidth | $5-10 |
| Vercel Edge | $10-15 |
| R2 Storage | $0.50-1 |
| R2 Operations | $1-2 |
| PostgreSQL | $20 |
| **TOTAL** | **$81.50-128** |

### After All Optimizations
| Service | Cost/Month |
|---------|-----------|
| Vercel Functions | $8-15 |
| Vercel Bandwidth | $1-2 |
| Vercel Edge | $2-4 |
| R2 Storage | $0.15-0.30 |
| R2 Operations | $0.20-0.50 |
| Cloudflare Workers | $0-5 |
| PostgreSQL | $20 |
| **TOTAL** | **$31.35-46.80** |

### 💰 Total Savings: $50-81/month (62-75%)

---

## 🎯 SUCCESS CRITERIA

### Phase 1 Success (After 1 Week)
- ✅ No calls to /api/get-image-url in production
- ✅ Static pages showing in Vercel analytics as "Served from Edge"
- ✅ Middleware invocations reduced by 70%+
- ✅ Example images loading lazy
- ✅ Cleanup cron running daily
- ✅ Vercel costs down 30-40%

### Phase 2 Success (After 1 Month)
- ✅ Worker processing 90%+ of images
- ✅ Average function duration < 2 seconds
- ✅ CDN cache hit rate > 85%
- ✅ No long-running Vercel functions
- ✅ Vercel costs down 60-70%

### Phase 3 Success (After 3 Months)
- ✅ Cost alerts set up and working
- ✅ Monthly costs stable around $30-45
- ✅ Zero cost spikes
- ✅ System handles 10x traffic without cost increase

---

## 🆘 TROUBLESHOOTING

### Issue: "Images not loading after Phase 1"
**Solution:** Check R2_PUBLIC_URL in environment variables

### Issue: "Worker not processing images"
**Solution:** Check Worker logs in Cloudflare dashboard, verify secrets

### Issue: "CDN not caching"
**Solution:** Verify Cache-Control headers, check Cloudflare cache rules

### Issue: "Cleanup cron deleting paid images"
**Solution:** Check isPaid logic in cleanup script, add safeguards

---

## 📞 SUPPORT

**Questions?** Drop a comment or check:
- Vercel docs: https://vercel.com/docs
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare R2: https://developers.cloudflare.com/r2/

**Ready to start?** Begin with Phase 1, Task 1! 🚀

