/**
 * Test script for Cashfree payment integration
 * Run with: node test-payment.js
 */

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || 'your-app-id';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || 'your-secret-key';
const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || 'sandbox';

async function testCashfreeConnection() {
  try {
    console.log('Testing Cashfree connection...');
    console.log('App ID:', CASHFREE_APP_ID);
    console.log('Environment:', CASHFREE_ENVIRONMENT);
    
    // Test basic connection
    const response = await fetch('https://sandbox-api.cashfree.com/pg/orders', {
      method: 'GET',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Cashfree connection successful');
      const data = await response.json();
      console.log('Orders count:', data.length || 0);
    } else {
      console.log('❌ Cashfree connection failed');
      console.log('Status:', response.status);
      console.log('Error:', await response.text());
    }
  } catch (error) {
    console.log('❌ Error testing Cashfree connection:', error.message);
  }
}

async function testOrderCreation() {
  try {
    console.log('\nTesting order creation...');
    
    const orderData = {
      orderId: `test_order_${Date.now()}`,
      orderAmount: 4900, // ₹49
      orderCurrency: 'INR',
      orderNote: 'Test order for 1 credit',
      customerDetails: {
        customerId: 'test_user_123',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '9999999999',
      },
    };

    const response = await fetch('https://sandbox-api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (response.ok) {
      console.log('✅ Order creation successful');
      const data = await response.json();
      console.log('Order ID:', data.cfOrderId);
      console.log('Payment Session ID:', data.paymentSessionId);
    } else {
      console.log('❌ Order creation failed');
      console.log('Status:', response.status);
      console.log('Error:', await response.text());
    }
  } catch (error) {
    console.log('❌ Error testing order creation:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Cashfree Payment Integration Test\n');
  
  if (CASHFREE_APP_ID === 'your-app-id' || CASHFREE_SECRET_KEY === 'your-secret-key') {
    console.log('❌ Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables');
    console.log('Example: CASHFREE_APP_ID=your-app-id CASHFREE_SECRET_KEY=your-secret-key node test-payment.js');
    return;
  }

  await testCashfreeConnection();
  await testOrderCreation();
  
  console.log('\n📋 Test Summary:');
  console.log('1. Verify Cashfree credentials are correct');
  console.log('2. Check webhook URL configuration');
  console.log('3. Test payment flow with test cards');
  console.log('4. Monitor webhook processing');
}

runTests();
