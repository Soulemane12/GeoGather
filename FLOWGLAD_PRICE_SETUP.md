# Flowglad Price ID Setup Guide

## Current Issue
The payment system is showing "Payment system is not configured yet" because the price IDs in the code don't match your actual Flowglad price IDs.

## How to Fix This

### Step 1: Create Products and Prices in Flowglad Dashboard

1. **Log into your Flowglad dashboard** at https://dashboard.flowglad.com
2. **Create three products**:
   - "Basic Plan" 
   - "Pro Plan"
   - "Enterprise Plan"

3. **For each product, create a subscription price**:
   - **Basic Plan**: $9.99/month
   - **Pro Plan**: $29.99/month  
   - **Enterprise Plan**: $99.99/month

4. **Copy the price IDs** from your Flowglad dashboard

### Step 2: Update the Price IDs in Code

Open `src/components/PricingPlans.tsx` and replace the placeholder price IDs:

```typescript
const plans: PricingPlan[] = [
  {
    id: 'YOUR_ACTUAL_BASIC_PRICE_ID_HERE', // Replace this
    name: 'Basic',
    price: '$9.99',
    // ... rest of the plan
  },
  {
    id: 'YOUR_ACTUAL_PRO_PRICE_ID_HERE', // Replace this
    name: 'Pro',
    price: '$29.99',
    // ... rest of the plan
  },
  {
    id: 'YOUR_ACTUAL_ENTERPRISE_PRICE_ID_HERE', // Replace this
    name: 'Enterprise',
    price: '$99.99',
    // ... rest of the plan
  }
]
```

### Step 3: Example Price IDs

Your Flowglad price IDs will look something like this:
- `price_01h8x2k3m4n5p6q7r8s9t0u1v2w3x4y5z6`
- `price_01h8x2k3m4n5p6q7r8s9t0u1v2w3x4y5z7`
- `price_01h8x2k3m4n5p6q7r8s9t0u1v2w3x4y5z8`

### Step 4: Test the Payment System

1. **Run the development server**: `npm run dev`
2. **Go to the pricing page**: `/pricing`
3. **Click "Get Started"** on any plan
4. **You should see the Flowglad checkout** instead of the error message

## Troubleshooting

### If you still see "Payment system is not configured yet":
1. Check that your `.env.local` file has `FLOWGLAD_SECRET_KEY`
2. Verify the price IDs match exactly (case-sensitive)
3. Make sure the prices are active in your Flowglad dashboard

### If you see "Price configuration error":
1. Double-check the price IDs are correct
2. Ensure the prices are subscription prices (not one-time payments)
3. Verify the prices are in the same currency (USD)

### If you see "API configuration error":
1. Check your `FLOWGLAD_SECRET_KEY` is valid
2. Ensure you're using the correct environment (test vs production)
3. Verify your Flowglad account is active

## Next Steps

Once the price IDs are configured:
1. Test the checkout flow with test cards
2. Set up webhooks for subscription events
3. Configure user authentication
4. Deploy to production with production keys

## Test Cards

Use these test cards in Flowglad's test mode:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Expired**: `4000 0000 0000 0069`

---

**Need help?** Check the Flowglad documentation or join their Discord for support.
