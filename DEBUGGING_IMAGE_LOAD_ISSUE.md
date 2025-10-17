# Debugging: "Failed to fetch images after all retry attempts"

## Issue

During happy path testing, you're seeing this error on the payment success page:
```
Failed to fetch images after all retry attempts. Verification success: true
```

This means:
- ✅ Payment verification succeeded
- ❌ Image URL fetching failed

## Enhanced Debugging (Already Added)

I've added comprehensive logging that will now show you exactly what's happening. Check your browser console for these messages:

### 1. **API Response Status Errors**
```
Original image URL request failed: 404 {"error":"output image not available","jobStatus":"DONE",...}
Output image URL request failed: 404 {"error":"output image not available","jobStatus":"PENDING",...}
```

### 2. **Missing URL Warnings**
```
Original image URL not found. Response: {...} JobId: abc-123
Output image URL not found. Response: {...} JobId: abc-123
```

### 3. **Retry Attempts**
```
Image URLs incomplete on attempt 1. Original: true, Output: false
Image URLs incomplete on attempt 2. Original: true, Output: false
```

### 4. **Direct URL Construction (Fallback)**
```
Failed to fetch URLs from API, attempting direct URL construction...
Constructed direct output URL: https://your-r2-url.com/outputs/job-id-colorized.jpg
```

## Common Root Causes

### Cause 1: Job Not Fully Processed ⚠️ **Most Likely**

**Symptoms:**
- Console shows: `jobStatus: "PENDING"` or `jobStatus: "PROCESSING"`
- Only `originalUrl` exists, no `outputUrl`

**Why This Happens:**
During testing, if you:
1. Upload an image
2. Immediately navigate away or refresh
3. Or mock the payment without waiting for processing
4. Then try to access the success page

The job won't have an `outputUrl` yet because image processing hasn't completed.

**Solution:**
- Wait for the payment modal to show (this means processing is done)
- Only then proceed with payment
- Or check the job status in the database:
  ```sql
  SELECT id, status, original_url, output_url FROM jobs WHERE id = 'your-job-id';
  ```

### Cause 2: Database Not Updated

**Symptoms:**
- Console shows: `jobStatus: "DONE"`
- But `hasOutput: false` in the debug info

**Why This Happens:**
- Database connection issues
- Transaction not committed
- Prisma client cache issue

**Solution:**
Check the database directly:
```sql
SELECT id, status, output_url FROM jobs 
WHERE id = 'your-job-id';
```

If `output_url` is NULL but `status` is 'DONE', there's a bug in the submit-job endpoint.

### Cause 3: Wrong Job ID

**Symptoms:**
- Console shows: `Job not found` (404)

**Why This Happens:**
- Using an old/expired job ID
- Copy-paste error in testing
- Order metadata doesn't match actual job

**Solution:**
Verify the job ID in the URL matches the order:
```sql
SELECT id, metadata FROM orders WHERE id = 'your-order-id';
-- Check that metadata->jobId matches the job_id in the URL
```

### Cause 4: Environment Variable Issues

**Symptoms:**
- URLs are constructed but images don't load
- CORS errors in console

**Why This Happens:**
- `NEXT_PUBLIC_R2_URL` not set correctly
- R2 bucket permissions wrong

**Solution:**
1. Check `.env` file:
   ```bash
   echo $NEXT_PUBLIC_R2_URL
   ```
2. Should be like: `https://pub-xxx.r2.dev` or similar
3. Test direct access: Open the constructed URL in a new tab

## Testing Properly

### Happy Path Test Checklist

Follow these steps IN ORDER:

1. **Upload Image**
   ```
   ✓ Select a test image (< 10MB)
   ✓ Wait for upload to complete (progress bar reaches 100%)
   ```

2. **Wait for Processing**
   ```
   ✓ DO NOT navigate away during processing
   ✓ Wait for the payment modal to appear
   ✓ Verify you can see the colorized preview
   ```

3. **Initiate Payment**
   ```
   ✓ Click "Unlock & Download" button
   ✓ You'll be redirected to PhonePe
   ```

4. **Complete Payment**
   ```
   ✓ Use test credentials or real payment
   ✓ Wait for payment confirmation
   ✓ You'll be redirected back automatically
   ```

5. **Success Page**
   ```
   ✓ Should show "Your Memory is Restored!"
   ✓ Image should load within 5-10 seconds
   ✓ Download button should become enabled
   ```

### If Image Doesn't Load

**Check Console For:**
1. The `jobStatus` in error messages
2. Which API call failed (original or output)
3. The exact error response from get-image-url

**Then:**

**If `jobStatus: "PENDING"` or `"PROCESSING"`:**
- The job hasn't finished processing yet
- This shouldn't happen in normal flow
- Check the submit-job API logs to see if there was an error

**If `jobStatus: "DONE"` but `hasOutput: false`:**
- Database inconsistency
- Run this query:
  ```sql
  SELECT * FROM jobs WHERE id = 'your-job-id';
  ```
- If `output_url` is NULL, there's a bug in submit-job

**If `jobStatus: "DONE"` and `hasOutput: true`:**
- API is working
- Check for network errors in console
- Try refreshing the page

## Fallback Mechanisms (Now Active)

The code now has multiple fallbacks:

### Layer 1: API with Retry (5 attempts)
- Tries to fetch URLs from database
- Retries on failure with exponential backoff

### Layer 2: Direct URL Construction
- If API fails, constructs URL directly:
  ```
  https://your-r2-url.com/outputs/{jobId}-colorized.jpg
  ```
- This works if the file exists in R2 even if DB is wrong

### Layer 3: Support Message
- If everything fails, shows WhatsApp support button
- Pre-fills order ID and job ID for quick help

## Quick Debug Commands

### Check Job in Database
```bash
psql $DATABASE_URL -c "SELECT id, status, original_url IS NOT NULL as has_original, output_url IS NOT NULL as has_output FROM jobs WHERE id = 'your-job-id';"
```

### Check Order Payment Status
```bash
psql $DATABASE_URL -c "SELECT id, status, metadata FROM orders WHERE id = 'your-order-id';"
```

### Test get-image-url API Directly
```bash
# Test in browser or curl:
curl "https://your-domain.com/api/get-image-url?jobId=YOUR_JOB_ID&type=output"

# Should return: {"url":"https://..."}
# Or error with debug info if job not ready
```

### Test Direct R2 URL
```bash
# If you know the job ID, test direct access:
curl -I "https://your-r2-url.com/outputs/YOUR_JOB_ID-colorized.jpg"

# Should return 200 OK if file exists
```

## Next Steps

1. **Run your happy path test again** with these changes
2. **Check the console** for the new detailed error messages
3. **Report back** what you see in the console, specifically:
   - The jobStatus value
   - Whether hasOriginal and hasOutput are true/false
   - Any 404 error responses

This will tell us exactly what's wrong and how to fix it!

## If You Need Immediate Fix

If a user is stuck, you can manually fix it:

### Option 1: Check Job Status
```sql
-- Find the job
SELECT * FROM jobs WHERE id = 'job-id-from-error';

-- If status is PENDING/PROCESSING, wait for it to complete
-- If status is DONE but output_url is NULL, there's a bug
```

### Option 2: Re-process the Job
If the job status is stuck, you might need to re-process it. (This would require a new endpoint or manual intervention.)

### Option 3: Give User Direct Link
If the file exists in R2 but DB is wrong:
```
https://your-r2-url.com/outputs/{jobId}-colorized.jpg
```

---

**Let me know what the console shows and we'll fix the root cause!**

