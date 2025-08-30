# Mapbox Setup Guide

## Current Issue
The map is showing an error because the Mapbox access token is not configured. The error `TypeError: undefined is not an object (evaluating 'e.catalog')` is caused by missing Mapbox configuration.

## How to Fix This

### Step 1: Get a Mapbox Access Token

1. **Go to Mapbox** at https://account.mapbox.com/
2. **Sign up or log in** to your Mapbox account
3. **Navigate to Access Tokens** in your account dashboard
4. **Create a new token** or copy your default public token
5. **Make sure the token has the following scopes**:
   - `styles:read`
   - `styles:tiles`
   - `geocoding:read`

### Step 2: Add Token to Environment

Add the token to your `.env.local` file:

```bash
# Mapbox (Required for maps)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNrZXhhbXBsZSJ9.example

# Other existing tokens...
FLOWGLAD_SECRET_KEY=sk_test_2UqS7Jvw7Ur7378qP8Pv5yd9r3wbr7GvEPq4Vsr1NUT8mr
GROQ_API_KEY=your_groq_key
TICKETMASTER_API_KEY=your_ticketmaster_key
SERPAPI_API_KEY=your_serp_api_key
```

### Step 3: Restart Development Server

After adding the token, restart your development server:

```bash
npm run dev
```

### Step 4: Test the Map

1. Go to your application
2. Navigate to the map page or home page
3. The map should now load without errors

## Troubleshooting

### If you still see the catalog error:
1. **Check token format**: Make sure it starts with `pk.`
2. **Verify token permissions**: Ensure it has the required scopes
3. **Check environment variable**: Make sure `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set
4. **Restart server**: After adding the token, restart your dev server

### If the map doesn't load:
1. **Check browser console** for specific error messages
2. **Verify token is valid** by testing it in the Mapbox playground
3. **Check network requests** to see if Mapbox API calls are failing

### If you get rate limiting errors:
1. **Upgrade your Mapbox plan** if you're on the free tier
2. **Check your usage** in the Mapbox dashboard
3. **Consider caching** map tiles to reduce API calls

## Example Token Format

Your Mapbox token should look like this:
```
pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNrZXhhbXBsZSJ9.example
```

## Free Tier Limits

- **50,000 map loads per month**
- **100,000 geocoding requests per month**
- **Sufficient for development and small applications**

## Next Steps

Once the map is working:
1. Test event search functionality
2. Verify map markers appear correctly
3. Test map interactions (clicking, zooming)
4. Deploy to production with the same token

---

**Need help?** Check the [Mapbox documentation](https://docs.mapbox.com/) or contact Mapbox support.
