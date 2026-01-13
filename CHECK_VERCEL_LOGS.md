# How to Check Vercel Logs for Webhook Errors

## Step-by-Step Instructions

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select project: `upper-room-calendly-server`

2. **Open Logs Tab**
   - Click on **"Logs"** tab at the top
   - Filter by route: `/api/webhook/calendly`

3. **Look for Errors**
   - Find the most recent log entry (should be from the test we just ran)
   - Look for error messages like:
     - `NOT_AUTHORIZED`
     - `You are not authorized`
     - `Error: ...`
     - `Cannot read property ...`

4. **Check What Code is Deployed**
   - Go to **"Source"** tab
   - See what files are actually deployed
   - Check if `api/webhook/calendly.js` exists in the deployment

## What We Know So Far

✅ Environment variables are set correctly in Vercel
✅ Webhook subscription exists and is active
✅ Endpoint exists (returns 500, not 404)
❌ Endpoint code is getting "not authorized" from Airtable

## Most Likely Issues

1. **Old code deployed** - The endpoint code on Vercel might be old/broken
2. **Not reading environment variables** - Code might be using hardcoded keys
3. **Wrong environment variable names** - Code might expect different variable names

## Next Steps

After checking Vercel logs, we can:
- See the exact error message
- Understand what the deployed code is doing
- Fix the issue accordingly

