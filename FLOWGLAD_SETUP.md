# Flowglad Payment System Setup Guide

## Overview

This guide explains how to set up Flowglad for subscription billing in your GeoGatheer application. Flowglad is a modern subscription billing platform that handles payments, subscriptions, and customer management.

## How the Payment System Works

### 1. **Pricing Plans Structure**

The application includes three subscription tiers:

- **Basic Plan ($9.99/month)**: Up to 100 events per month, basic search, email support
- **Pro Plan ($29.99/month)**: Unlimited events, advanced features, priority support
- **Enterprise Plan ($99.99/month)**: Everything in Pro plus API access, white-label options

### 2. **Payment Flow**

1. **Customer selects a plan** on the `/pricing` page
2. **Checkout session is created** using Flowglad's API
3. **Customer completes payment** through Flowglad's secure checkout
4. **Subscription is activated** and customer gains access to plan features
5. **Customer can manage billing** on the `/billing` page

### 3. **Subscription Management**

- Customers can view their current plan on `/billing`
- Upgrade/downgrade between plans
- Cancel subscriptions
- Update payment methods
- View billing history

## Setup Instructions

### Step 1: Environment Configuration

Create a `.env.local` file in your project root:

```bash
# Flowglad Configuration
FLOWGLAD_SECRET_KEY="sk_test_2UqS7Jvw7Ur7378qP8Pv5yd9r3wbr7GvEPq4Vsr1NUT8mr"

# Other required API keys (from your existing setup)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
GROQ_API_KEY=your_groq_key
TICKETMASTER_API_KEY=your_ticketmaster_key
SERPAPI_API_KEY=your_serp_api_key
```

### Step 2: Flowglad Dashboard Setup

1. **Create Products and Prices**:
   - Log into your Flowglad dashboard
   - Create three products: "Basic Plan", "Pro Plan", "Enterprise Plan"
   - For each product, create a subscription price with the monthly amounts
   - Note down the `priceId` for each plan

2. **Update Price IDs**:
   - In `src/components/PricingPlans.tsx`, replace the plan IDs with your actual Flowglad price IDs:
   ```typescript
   const plans: PricingPlan[] = [
     {
       id: 'your_basic_price_id_here', // Replace with actual Flowglad price ID
       name: 'Basic',
       price: '$9.99',
       // ... rest of the plan
     },
     // ... other plans
   ]
   ```

### Step 3: Enable Flowglad API

Once you have your price IDs configured, uncomment and update the Flowglad server setup:

1. **Update `src/lib/flowglad.ts`**:
```typescript
import { FlowgladServer } from '@flowglad/nextjs/server'

export const flowgladServer = new FlowgladServer({
  // Add your configuration here
  // For example, if using Supabase Auth:
  // supabaseAuth: {
  //   client: createClient
  // }
})
```

2. **Update `src/app/api/flowglad/[...path]/route.ts`**:
```typescript
import { createAppRouterRouteHandler } from '@flowglad/nextjs/server';
import { flowgladServer } from '@/lib/flowglad';

const routeHandler = createAppRouterRouteHandler(flowgladServer);

export { routeHandler as GET, routeHandler as POST }
```

## Features Implemented

### ✅ **Pricing Page** (`/pricing`)
- Beautiful pricing cards with feature lists
- "Get Started" buttons that trigger checkout
- Responsive design for all devices

### ✅ **Billing Management** (`/billing`)
- Flowglad's built-in billing page component
- Subscription management interface
- Payment method updates

### ✅ **Navigation**
- Clean navigation bar with links to all pages
- Active page highlighting

### ✅ **Error Handling**
- Graceful fallbacks when payment system is not configured
- User-friendly error messages

## Integration with Your Event System

The payment system integrates with your existing event search functionality:

- **Free users**: Limited to 50 events, 5-mile radius
- **Pro users**: Up to 200 events, 25-mile radius  
- **Premium users**: Unlimited events, no radius limit

This is already implemented in your `src/app/api/events/route.ts` file.

## Testing the Payment System

1. **Development Testing**:
   - Use Flowglad's test mode (your current key is a test key)
   - Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (declined)

2. **Production Deployment**:
   - Replace test keys with production keys
   - Update price IDs to production price IDs
   - Test with real payment methods

## Next Steps

1. **Authentication Integration**: Consider adding user authentication (Supabase, Clerk, NextAuth) to track subscriptions per user
2. **Usage Tracking**: Implement usage meters for event searches
3. **Webhooks**: Set up webhooks to handle subscription events
4. **Analytics**: Add subscription analytics and reporting

## Troubleshooting

- **Build Errors**: Make sure all TypeScript types are correct
- **Payment Failures**: Check Flowglad dashboard for error logs
- **API Issues**: Verify your `FLOWGLAD_SECRET_KEY` is correct
- **Price ID Errors**: Ensure price IDs in the code match your Flowglad dashboard

## Support

- Flowglad Documentation: https://docs.flowglad.com
- Flowglad Discord: Join for community support
- GitHub Issues: For code-specific problems

---

**Note**: The current implementation is set up for testing. For production use, make sure to:
- Use production API keys
- Implement proper user authentication
- Set up webhook handling
- Configure proper error monitoring
