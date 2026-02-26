# PrimeOS Environment Setup

## Required Environment Variables

### Google Places API
- **Key:** `GOOGLE_PLACES_API_KEY`
- **Where:** Vercel Dashboard → Settings → Environment Variables
- **Value:** (stored in `.env.local` for development)
- **Used by:** `/api/places/*` routes (nearby, details, find-store)
- **Free tier:** $200/month credit from Google Cloud

### FoodTec API (pending)
- **Key:** `FOODTEC_API_TOKEN`
- **Key:** `FOODTEC_CHAIN_URL`
- **Where:** Vercel Dashboard → Settings → Environment Variables
- **Status:** Waiting on Dan

### Reminder
After adding environment variables in Vercel, redeploy for changes to take effect.
