# API Setup Guide for VibeMap

To use the event search functionality, you need to set up several API keys in your `.env.local` file.

## Required API Keys:

### 1. **Mapbox** (Required)
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```
- Get from: https://account.mapbox.com/
- Used for: Map display and location services

### 2. **Groq AI** (Required)
```bash
GROQ_API_KEY=your_groq_api_key_here
```
- Get from: https://console.groq.com/
- Used for: Natural language processing of search queries
- Free tier available

### 3. **Ticketmaster** (Required)
```bash
TICKETMASTER_API_KEY=your_ticketmaster_api_key_here
```
- Get from: https://developer-acct.ticketmaster.com/
- Used for: Event search and discovery
- Free tier available

### 4. **Serp API** (Required)
```bash
SERPAPI_API_KEY=your_serp_api_key_here
```
- Get from: https://serpapi.com/
- Used for: Google Events search and discovery
- Free tier available

## Complete `.env.local` Example:

```bash
# Mapbox (Required)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNrZXhhbXBsZSJ9.example

# Groq AI (Required)
GROQ_API_KEY=gsk_your_groq_key_here

# Ticketmaster (Required)
TICKETMASTER_API_KEY=your_ticketmaster_key_here

# Serp API (Required)
SERPAPI_API_KEY=your_serp_api_key_here
```

## Features:

### 🔍 **Smart Event Search**
- Natural language queries: "jazz tonight", "rock concerts this weekend"
- AI-powered intent extraction using Groq
- Automatic keyword and time window detection

### 🎫 **Multi-Platform Events**
- **Ticketmaster**: Public events, concerts, sports, theater
- **Serp API**: Google Events search for comprehensive event discovery
- Automatic deduplication and sorting

### 🗺️ **Interactive Map**
- Event markers with bouncing animation
- Clickable popups with event details
- Direct links to ticket purchase

### 📍 **Location-Based Search**
- Uses your current location for nearby events
- Fallback to default location if geolocation fails
- City-specific event filtering

## Usage Examples:

1. **"jazz tonight"** - Finds jazz events happening tonight
2. **"rock concerts this weekend"** - Weekend rock concerts
3. **"comedy shows tomorrow"** - Comedy events tomorrow
4. **"live music near me"** - Live music events in your area

## Security Notes:
- All API keys are server-side only (except Mapbox)
- Environment variables are automatically ignored by git
- No sensitive data is exposed to the client
