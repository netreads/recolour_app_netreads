# Security Testing Guide

Quick guide to test all security measures are working correctly.

## Prerequisites
- Application running locally or on staging
- Test image ready to upload
- Multiple browsers available (Chrome, Firefox, Safari)
- DevTools knowledge

---

## Test 1: Right-Click Prevention ✅

**Steps:**
1. Upload an image
2. Wait for preview modal to appear
3. Right-click on the colorized preview image

**Expected Result:**
- ✅ Right-click menu should NOT appear
- ✅ "Open image in new tab" option not available
- ✅ "Save image as" option not available

**Status:** [ ] PASS [ ] FAIL

---

## Test 2: Drag Prevention ✅

**Steps:**
1. Open preview modal
2. Try to drag the colorized image to desktop
3. Try to drag to another browser window

**Expected Result:**
- ✅ Image should NOT be draggable
- ✅ No drag cursor appears
- ✅ Nothing happens when attempting to drag

**Status:** [ ] PASS [ ] FAIL

---

## Test 3: DevTools Keyboard Shortcuts ✅

**Steps:**
1. Open preview modal
2. Try these keyboard shortcuts:
   - F12
   - Ctrl+Shift+I (Cmd+Option+I on Mac)
   - Ctrl+Shift+J (Cmd+Option+J on Mac)
   - Ctrl+Shift+C (Cmd+Option+C on Mac)
   - Ctrl+U (Cmd+U on Mac)

**Expected Result:**
- ✅ None of these shortcuts should work
- ✅ DevTools should NOT open
- ✅ Console should NOT open
- ✅ View Source should NOT open

**Status:** [ ] PASS [ ] FAIL

---

## Test 4: Watermark Visibility ✅

**Steps:**
1. Open preview modal
2. Examine the colorized preview

**Expected Result:**
- ✅ Multiple watermarks visible:
  - "ReColor AI 🔒 Pay to Unlock" in center
  - "PREVIEW" diagonal text across image
  - "🔒 HD Locked" badge at top
- ✅ Watermarks are clearly visible
- ✅ Cannot be easily removed

**Status:** [ ] PASS [ ] FAIL

---

## Test 5: Canvas Rendering ✅

**Steps:**
1. Open preview modal
2. Open DevTools via browser menu (if you can)
3. Inspect the preview image element
4. Look at the DOM structure

**Expected Result:**
- ✅ Image is rendered as `<canvas>` element
- ✅ NOT a regular `<img>` tag
- ✅ No `src` attribute visible with image URL
- ✅ Canvas data not easily extractable

**Status:** [ ] PASS [ ] FAIL

---

## Test 6: Network Tab Inspection ✅

**Steps:**
1. Open DevTools via browser menu (Three dots → More Tools → Developer Tools)
2. Go to Network tab
3. Upload an image and wait for preview
4. Check network requests for image URLs

**Expected Result:**
- ✅ Full-quality image URL NOT visible in network tab
- ✅ Only API calls to `/api/preview-image` visible
- ✅ API returns payment required status (402)
- ✅ Full image URL not exposed

**Status:** [ ] PASS [ ] FAIL

---

## Test 7: Direct URL Access ✅

**Steps:**
1. Complete a colorization (don't pay)
2. Note the job ID from the URL or API
3. Try to construct the output URL manually:
   - `https://your-r2-url.com/outputs/{jobId}-colorized.jpg`
4. Open this URL directly in a new tab

**Expected Result:**
- ✅ Either image doesn't load
- ✅ Or you see the watermarked version
- ✅ Full HD version is NOT accessible

**Status:** [ ] PASS [ ] FAIL

---

## Test 8: Screenshot Protection ✅

**Steps:**
1. Open preview modal
2. Take a screenshot (use OS screenshot tool)
3. Check the screenshot

**Expected Result:**
- ⚠️ Screenshot CAN be taken (cannot prevent)
- ✅ BUT watermarks are visible in screenshot
- ✅ Screenshot is less valuable due to watermarks
- ✅ User still needs to pay for clean version

**Status:** [ ] PASS [ ] FAIL

---

## Test 9: Mobile Long-Press (iOS/Android) ✅

**Steps:**
1. Open site on mobile device
2. Navigate to preview modal
3. Long-press on the colorized image

**Expected Result:**
- ✅ iOS context menu should NOT appear
- ✅ "Save Image" option not available
- ✅ "Copy" option not available
- ✅ No action sheet appears

**Status:** [ ] PASS [ ] FAIL

---

## Test 10: Payment Flow ✅

**Steps:**
1. Upload and preview an image
2. Complete payment (use test mode if available)
3. Check payment success page

**Expected Result:**
- ✅ Full HD image visible on success page
- ✅ NO watermarks on success page
- ✅ Download button works
- ✅ Right-click now works (allowed after payment)
- ✅ Can save and open in new tab

**Status:** [ ] PASS [ ] FAIL

---

## Test 11: API Payment Verification ✅

**Steps:**
1. Upload an image (job ID: ABC123)
2. Before payment, call API:
   ```
   GET /api/preview-image?jobId=ABC123&type=colorized
   ```
3. Check the response

**Expected Result:**
- ✅ Response status: 402 (Payment Required)
- ✅ Response body does NOT contain image URL
- ✅ Response includes: `{ "isPaid": false, "preview": true }`

**After Payment:**
- ✅ Same API returns: `{ "url": "...", "isPaid": true }`

**Status:** [ ] PASS [ ] FAIL

---

## Test 12: Cross-Browser Compatibility ✅

**Browsers to Test:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

**For Each Browser:**
1. Upload image
2. Open preview
3. Try right-click
4. Try keyboard shortcuts
5. Check watermarks visible

**Expected Result:**
- ✅ All protections work in all browsers
- ✅ Watermarks visible everywhere
- ✅ No browser-specific bypasses

**Status:** [ ] PASS [ ] FAIL

---

## Test 13: Console Manipulation ✅

**Steps:**
1. Open DevTools via browser menu
2. Go to Console tab
3. Try to find the image URL:
   ```javascript
   // Try various commands
   document.querySelector('canvas').toDataURL()
   document.querySelector('canvas').src
   window.location
   ```

**Expected Result:**
- ⚠️ `toDataURL()` might return canvas data
- ✅ BUT it includes watermarks
- ✅ Original URL not accessible
- ✅ Canvas data is watermarked

**Status:** [ ] PASS [ ] FAIL

---

## Test 14: Download Button (After Payment) ✅

**Steps:**
1. Complete payment
2. On success page, click "Download Full HD Image"

**Expected Result:**
- ✅ Image downloads successfully
- ✅ Downloaded image is full HD
- ✅ NO watermarks
- ✅ File size is large (not compressed)
- ✅ Image quality is excellent

**Status:** [ ] PASS [ ] FAIL

---

## Test 15: Database Verification ✅

**Steps:**
1. Create a job (before payment)
2. Check database:
   ```sql
   SELECT id, isPaid FROM jobs WHERE id = 'jobId';
   ```
3. Complete payment
4. Check database again

**Expected Result:**
- ✅ Before payment: `isPaid = false`
- ✅ After payment: `isPaid = true`
- ✅ API respects this flag
- ✅ Cannot manually set to true without payment

**Status:** [ ] PASS [ ] FAIL

---

## Troubleshooting

### If Right-Click Still Works:
- Check if `SecurityProtection` component is mounted
- Verify `onContextMenu` handlers are attached
- Check browser console for errors

### If DevTools Open:
- Some browsers allow DevTools via menu (expected)
- Check if keyboard shortcuts are blocked (main goal)
- Verify `SecurityProtection` is active

### If URL Is Exposed:
- Check `/api/preview-image` endpoint
- Verify payment status check
- Ensure canvas rendering is used
- Check if `isPaid` flag is correct

### If Watermarks Missing:
- Check `SecureImagePreview` component is used
- Verify canvas rendering completes
- Check browser console for errors
- Ensure image loads successfully

---

## Test Results Summary

Date: _________________
Tester: _________________

| Test | Status | Notes |
|------|--------|-------|
| 1. Right-Click Prevention | [ ] | |
| 2. Drag Prevention | [ ] | |
| 3. DevTools Shortcuts | [ ] | |
| 4. Watermark Visibility | [ ] | |
| 5. Canvas Rendering | [ ] | |
| 6. Network Inspection | [ ] | |
| 7. Direct URL Access | [ ] | |
| 8. Screenshot Protection | [ ] | |
| 9. Mobile Long-Press | [ ] | |
| 10. Payment Flow | [ ] | |
| 11. API Verification | [ ] | |
| 12. Cross-Browser | [ ] | |
| 13. Console Manipulation | [ ] | |
| 14. Download Button | [ ] | |
| 15. Database Verification | [ ] | |

**Overall Result:** [ ] ALL PASS [ ] SOME FAILURES

---

## Known Acceptable Limitations

These are expected and acceptable:
- ✅ DevTools can still be opened via browser menu
- ✅ Screenshots can be taken (but are watermarked)
- ✅ Screen recording is possible (but watermarked)
- ✅ Very technical users might extract canvas data (but it's watermarked)

**Why Acceptable:**
- Watermarks make extracted images less valuable
- Low price point (₹49) makes bypassing not worthwhile
- Perfect security is impossible; we aim for "secure enough"
- Most users will simply pay rather than attempt bypass

---

## Sign-Off

After completing all tests and verifying all pass:

**Tested By:** _________________
**Date:** _________________
**Signature:** _________________

**Approved By:** _________________
**Date:** _________________
**Signature:** _________________

---

## Notes

Use this space for additional observations:

_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________

