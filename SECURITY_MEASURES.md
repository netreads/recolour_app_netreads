# Security Measures for Image Preview Protection

This document outlines the comprehensive security measures implemented to prevent users from accessing full-quality colorized images before payment.

## Problem Statement

Users were able to:
1. Right-click on preview images to "Open in new tab" or "Save image as"
2. Use browser DevTools to inspect elements and extract image URLs
3. Access the colorized image URL directly from the network tab
4. Take screenshots or use other bypass methods

## Multi-Layer Security Solution

We've implemented a defense-in-depth approach with multiple security layers:

---

## Layer 1: Client-Side Canvas Rendering

### Implementation: `SecureImagePreview` Component

**Location:** `/src/components/SecureImagePreview.tsx`

**Features:**
- Renders images to a Canvas element instead of using `<img>` tags
- Canvas elements are harder to extract than regular images
- Adds multiple watermarks at different positions:
  - Top center watermark with lock icon
  - Center watermark with branding
  - Diagonal repeating "PREVIEW" text across entire image
- Semi-transparent rounded backgrounds for watermarks
- Optional blur filter for additional obfuscation

**Protection Against:**
- ✅ Right-click → Open in new tab
- ✅ Right-click → Save image as
- ✅ Drag and drop to desktop
- ✅ Simple inspect element to find URL
- ✅ Makes screenshots less valuable (watermarked)

**Usage:**
```tsx
<SecureImagePreview
  imageUrl={imageUrl}
  alt="Preview"
  watermarkText="ReColor AI 🔒 Pay to Unlock"
  className="w-full h-full"
  blur={false}
/>
```

---

## Layer 2: Browser DevTools Prevention

### Implementation: `SecurityProtection` Component

**Location:** `/src/components/SecurityProtection.tsx`

**Features:**
- Blocks common keyboard shortcuts:
  - F12 (DevTools)
  - Ctrl+Shift+I / Cmd+Option+I (Inspect Element)
  - Ctrl+Shift+J / Cmd+Option+J (Console)
  - Ctrl+Shift+C / Cmd+Option+C (Element Picker)
  - Ctrl+U / Cmd+U (View Source)
- Detects when DevTools are open (window size detection)
- Prevents right-click on canvas and image elements
- Monitors visibility changes (possible screenshot attempts)

**Protection Against:**
- ✅ Opening DevTools via keyboard shortcuts
- ✅ Inspecting elements to find URLs
- ✅ Viewing page source
- ⚠️ DevTools opened via browser menu (detected, but not blocked)

**Usage:**
```tsx
{showPaymentModal && (
  <>
    <SecurityProtection />
    {/* Modal content */}
  </>
)}
```

---

## Layer 3: Server-Side Payment Verification

### Implementation: Secure API Endpoint

**Location:** `/src/app/api/preview-image/route.ts`

**Features:**
- Always checks payment status from database
- Returns 402 Payment Required for unpaid jobs
- Never exposes full-quality image URL until payment confirmed
- Separate endpoints for original and colorized images
- Server-side enforcement of access control

**Protection Against:**
- ✅ Direct URL access to colorized images
- ✅ Bypassing client-side protections
- ✅ API manipulation attempts
- ✅ Unauthorized downloads

**API Responses:**

**Before Payment:**
```json
{
  "isPaid": false,
  "preview": true,
  "message": "Payment required to access full-quality image"
}
// Note: URL is NOT included
```

**After Payment:**
```json
{
  "url": "https://...",
  "isPaid": true,
  "preview": false
}
```

---

## Layer 4: UI/UX Security Enhancements

### Implementation: CSS and HTML Attributes

**Location:** `/src/app/page.tsx`

**Features:**
- `user-select: none` - Prevents text selection
- `-webkit-user-select: none` - Safari support
- `-webkit-touch-callout: none` - iOS long-press menu
- `pointer-events: none` on canvas - Prevents interaction
- `onContextMenu` preventDefault - Blocks right-click menu
- `onDragStart` preventDefault - Blocks dragging
- Multiple overlapping divs to complicate inspection

**Protection Against:**
- ✅ Text/element selection
- ✅ Touch-and-hold context menu (mobile)
- ✅ Drag-to-desktop
- ✅ Simple inspect element attempts

**Code Example:**
```tsx
<div
  onContextMenu={(e) => { e.preventDefault(); return false; }}
  onDragStart={(e) => { e.preventDefault(); return false; }}
  style={{
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
  }}
>
  <SecureImagePreview {...props} />
</div>
```

---

## Layer 5: Database-Level Access Control

### Implementation: Payment Verification Flow

**Features:**
1. Job records track `isPaid` status
2. Payment webhook updates database
3. All image access checks `isPaid` flag
4. No client-side trust - always verify server-side

**Payment Flow:**
```
1. User uploads image → Job created (isPaid: false)
2. Preview shown with watermarks
3. User clicks "Pay" → Order created
4. Payment gateway redirects → Webhook received
5. Database updated (isPaid: true)
6. Full HD image accessible
```

---

## What Users CANNOT Do Before Payment

1. ❌ Open image in new tab
2. ❌ Save image without watermarks
3. ❌ Copy image URL from DevTools
4. ❌ Access image directly via URL
5. ❌ Bypass watermarks via inspect element
6. ❌ Download full-quality version
7. ❌ Remove watermarks via CSS manipulation

---

## What Users CAN Do After Payment

1. ✅ View full HD image on success page
2. ✅ Right-click and save image
3. ✅ Download via download button
4. ✅ Open in new tab
5. ✅ Keep forever (no expiration)

---

## Known Limitations

While these measures significantly increase security, no client-side protection is 100% foolproof:

1. **Screen Recording:** Users can record their screen
2. **Screenshots:** Users can take screenshots (but watermarks remain)
3. **Advanced DevTools Users:** Very technical users with deep knowledge might find workarounds
4. **Physical Cameras:** Users can photograph their screen

**Mitigation:**
- Watermarks make screenshots less valuable
- Low commercial value of individually watermarked images
- Payment friction is low (₹49) making bypassing less worth the effort
- Preview quality gives users confidence to pay

---

## Testing the Security

### Test Checklist:

1. **Right-Click Test:**
   - ✅ Right-click on preview image → Menu should be blocked
   - ✅ Try "Open in new tab" → Should not work

2. **Keyboard Shortcuts Test:**
   - ✅ Press F12 → Should not open DevTools
   - ✅ Try Ctrl+Shift+I → Should be blocked
   - ✅ Try Ctrl+U → View source should be blocked

3. **Drag Test:**
   - ✅ Try to drag image to desktop → Should not work

4. **URL Access Test:**
   - ✅ Copy image URL from code → Try to access directly
   - ✅ Should see watermarked version or 402 error

5. **Payment Flow Test:**
   - ✅ Complete payment → Full image should be accessible
   - ✅ Download button should work
   - ✅ Right-click should now work on success page

---

## Monitoring and Analytics

To track bypass attempts:

1. Log all API calls to `/api/preview-image` with 402 responses
2. Monitor DevTools detection events
3. Track visibility change events (possible screenshots)
4. Analyze conversion rates (preview → payment)

---

## Future Enhancements

Potential additional security measures:

1. **Dynamic Watermarking:** Add user-specific watermarks with timestamp
2. **Image Chunking:** Split preview into multiple canvas pieces
3. **Server-Side Rendering:** Generate watermarked images server-side
4. **Time-Limited URLs:** Use signed URLs with expiration
5. **Rate Limiting:** Limit preview access attempts
6. **CAPTCHA:** Add CAPTCHA before showing preview
7. **WebGL Rendering:** Use WebGL for even more complex rendering

---

## Maintenance Notes

### When Updating:

1. **Adding New Features:** Ensure security components are active
2. **Changing Image Flow:** Always verify payment status server-side
3. **Updating UI:** Maintain CSS security attributes
4. **API Changes:** Keep `/api/preview-image` payment checks

### Regular Checks:

- [ ] Verify watermarks are clearly visible
- [ ] Test right-click prevention in major browsers
- [ ] Confirm DevTools blocking works
- [ ] Validate payment verification flow
- [ ] Check canvas rendering performance

---

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Support Contact

If users report issues accessing paid images:
1. Verify payment status in database
2. Check job `isPaid` flag
3. Confirm webhook was received
4. Manually update if needed: `UPDATE jobs SET isPaid = true WHERE id = 'xxx'`

---

## Legal Notice

These security measures are designed to:
- Protect intellectual property
- Ensure fair payment for services
- Prevent unauthorized distribution

They are not intended to:
- Violate user privacy
- Restrict legitimate paid access
- Prevent standard web browsing features after payment

Users who have paid have full rights to their colorized images.

