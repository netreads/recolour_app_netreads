// Quick environment check script
// Run this with: node check-env.js

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('\n🔍 Checking Environment Variables...\n');

const required = {
  'R2_PUBLIC_URL': process.env.R2_PUBLIC_URL,
  'R2_ACCOUNT_ID': process.env.R2_ACCOUNT_ID,
  'R2_BUCKET': process.env.R2_BUCKET,
  'R2_ACCESS_KEY_ID': process.env.R2_ACCESS_KEY_ID ? '✓ Set (hidden)' : undefined,
  'R2_SECRET_ACCESS_KEY': process.env.R2_SECRET_ACCESS_KEY ? '✓ Set (hidden)' : undefined,
  'NEXT_PUBLIC_R2_URL': process.env.NEXT_PUBLIC_R2_URL,
};

let hasErrors = false;

Object.entries(required).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key}: NOT SET`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key}: ${value}`);
  }
});

console.log('\n📋 URL Format Check:\n');

if (process.env.R2_PUBLIC_URL) {
  const url = process.env.R2_PUBLIC_URL;
  
  // Check if it's R2.dev
  if (url.includes('.r2.dev')) {
    console.log('✅ Using R2.dev public URL');
    
    if (!process.env.R2_ACCOUNT_ID) {
      console.log('❌ CRITICAL: R2_ACCOUNT_ID is REQUIRED for R2.dev URLs');
      console.log('   Find it in your Cloudflare Dashboard URL:');
      console.log('   https://dash.cloudflare.com/{ACCOUNT_ID}/r2/...');
      hasErrors = true;
    } else {
      console.log('✅ R2_ACCOUNT_ID is set');
    }
  } else if (url.includes('.r2.cloudflarestorage.com')) {
    console.log('✅ Using R2 cloudflarestorage URL');
  } else {
    console.log('⚠️  Unknown URL format');
  }
  
  // Check for trailing slash
  if (url.endsWith('/')) {
    console.log('⚠️  R2_PUBLIC_URL has trailing slash (will be handled)');
  }
  
  // Check if bucket name is in URL
  if (process.env.R2_BUCKET && url.includes(`/${process.env.R2_BUCKET}/`)) {
    console.log('❌ R2_PUBLIC_URL should NOT include bucket name in path');
    console.log(`   Remove "/${process.env.R2_BUCKET}/" from the URL`);
    hasErrors = true;
  }
}

console.log('\n📝 Expected URL Format:\n');
console.log(`   ${process.env.R2_PUBLIC_URL || 'https://pub-xxx.r2.dev'}/uploads/jobId-filename.jpg`);
console.log(`   ${process.env.R2_PUBLIC_URL || 'https://pub-xxx.r2.dev'}/outputs/jobId-colorized.jpg`);

console.log('\n' + '='.repeat(60) + '\n');

if (hasErrors) {
  console.log('❌ ERRORS FOUND - Please fix the issues above\n');
  console.log('Quick Fix:');
  console.log('1. Add missing environment variables to .env or .env.local');
  console.log('2. Restart your dev server: npm run dev');
  console.log('3. Upload a NEW image (old ones may still have wrong URLs)');
  process.exit(1);
} else {
  console.log('✅ All environment variables look good!\n');
  console.log('Next steps:');
  console.log('1. Restart your dev server if you just made changes');
  console.log('2. Upload a NEW image to test');
  console.log('3. Check browser DevTools Network tab for the image URL');
  process.exit(0);
}

