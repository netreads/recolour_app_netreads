# Cashfree Payment Gateway Integration

This document provides a comprehensive guide for the Cashfree payment gateway integration in the ReColor AI SaaS application.

## Overview

The application now supports credit purchases through Cashfree payment gateway with the following features:

- **Hosted Checkout**: Users are redirected to Cashfree's secure payment page
- **Real-time Webhooks**: Payment status updates are handled via webhooks
- **Credit Management**: Automatic credit addition upon successful payment
- **Order Tracking**: Complete order and transaction history

## Architecture

### Database Models

1. **Order**: Stores payment order information
2. **Transaction**: Tracks individual transactions and credit movements
3. **User**: Updated with credit balance

### API Endpoints

1. **POST /api/payments/create-order**: Creates a new payment order
2. **POST /api/payments/webhook**: Handles Cashfree webhook notifications
3. **GET /api/payments/status**: Checks payment status for an order

### Frontend Components

1. **PricingCard**: Updated pricing cards with payment integration
2. **Payment Success Page**: Shows payment confirmation and status

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
# Cashfree Payment Gateway
CASHFREE_APP_ID="your-cashfree-app-id"
CASHFREE_SECRET_KEY="your-cashfree-secret-key"
CASHFREE_ENVIRONMENT="sandbox"  # Use "production" for live environment
```

### 2. Cashfree Account Setup

1. **Create Account**: Sign up at [Cashfree](https://www.cashfree.com/)
2. **Get Credentials**: 
   - Go to [Cashfree Dashboard](https://merchant.cashfree.com/)
   - Navigate to "Developers" → "API Keys"
   - Copy App ID and Secret Key
3. **Configure Webhooks**:
   - Go to "Developers" → "Webhooks"
   - Add webhook URL: `https://your-domain.com/api/payments/webhook`
   - Enable events: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`, `PAYMENT_USER_DROPPED_WEBHOOK`

### 3. Database Migration

Run the database migration to add payment tables:

```bash
npx prisma migrate dev --name add_payment_models
```

## Credit Packages

The application supports four credit packages:

| Package | Credits | Price | Description |
|---------|---------|-------|-------------|
| Starter Pack | 1 | ₹49 | Perfect for trying out the service |
| Value Pack | 5 | ₹199 | Best value for regular users |
| Pro Pack | 12 | ₹399 | For power users and professionals |
| Business Pack | 35 | ₹999 | For teams and businesses |

## Payment Flow

1. **User Selection**: User selects a credit package on the pricing page
2. **Order Creation**: System creates an order and generates Cashfree payment session
3. **Payment Redirect**: User is redirected to Cashfree's hosted checkout page
4. **Payment Processing**: User completes payment on Cashfree's secure page
5. **Webhook Notification**: Cashfree sends webhook with payment status
6. **Credit Addition**: System adds credits to user account upon successful payment
7. **Success Page**: User is redirected to success page with confirmation

## Webhook Handling

The webhook handler (`/api/payments/webhook`) processes the following events:

- **PAYMENT_SUCCESS_WEBHOOK**: Adds credits to user account
- **PAYMENT_FAILED_WEBHOOK**: Marks order as failed
- **PAYMENT_USER_DROPPED_WEBHOOK**: Marks order as cancelled

## Testing

### Sandbox Environment

For testing, use Cashfree's sandbox environment:

- **Test Card (Success)**: 4111 1111 1111 1111
- **Test Card (Failure)**: 4000 0000 0000 0002
- **CVV**: Any 3-digit number
- **Expiry**: Any future date

### Test Scenarios

1. **Successful Payment**: Verify credits are added to user account
2. **Failed Payment**: Verify order status is updated correctly
3. **Cancelled Payment**: Verify order is marked as cancelled
4. **Webhook Processing**: Verify webhooks are processed correctly

## Security Considerations

1. **Webhook Validation**: Implement proper signature validation (currently simplified)
2. **Environment Variables**: Keep Cashfree credentials secure
3. **HTTPS**: Ensure all payment-related endpoints use HTTPS
4. **Input Validation**: Validate all payment-related inputs

## Error Handling

The system handles various error scenarios:

- **Invalid Package Type**: Returns 400 error
- **Authentication Failure**: Returns 401 error
- **Order Creation Failure**: Returns 500 error
- **Webhook Processing Failure**: Logs error and returns 500

## Monitoring and Logging

- All payment-related operations are logged
- Webhook events are logged for debugging
- Order and transaction statuses are tracked in database

## Production Deployment

Before going live:

1. **Switch Environment**: Change `CASHFREE_ENVIRONMENT` to "production"
2. **Update Credentials**: Use production App ID and Secret Key
3. **Configure Webhooks**: Update webhook URL to production domain
4. **Test Thoroughly**: Test all payment scenarios in production
5. **Monitor**: Set up monitoring for payment failures and webhook issues

## Troubleshooting

### Common Issues

1. **Webhook Not Received**: Check webhook URL configuration
2. **Payment Not Processing**: Verify Cashfree credentials
3. **Credits Not Added**: Check webhook processing logs
4. **Order Creation Failed**: Verify database connection and schema

### Debug Steps

1. Check application logs for errors
2. Verify Cashfree dashboard for payment status
3. Check database for order and transaction records
4. Test webhook endpoint manually

## Support

For issues related to:

- **Cashfree Integration**: Contact Cashfree support
- **Application Issues**: Check application logs and database
- **Payment Processing**: Verify Cashfree dashboard and webhook configuration
