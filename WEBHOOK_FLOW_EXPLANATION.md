# What Happens When Someone Books on Calendly - Step by Step

## Expected Flow (When Working Correctly)

### Step 1: Customer Books on Calendly
- Customer fills out booking form
- Calendly creates a scheduled event
- Calendly triggers webhook automatically (within seconds)

### Step 2: Calendly Calls Your Webhook (AUTOMATIC, 24/7)
- **URL**: `https://upper-room-calendly-server-5qy349sza-3echos-projects.vercel.app/api/webhook/calendly`
- **Method**: POST
- **Payload**: Contains event details (customer name, time, pax, phone, etc.)

### Step 3: Vercel Serverless Function Receives Request
- **File**: `api/webhook/calendly.js` (must exist on Vercel)
- Extracts booking data from payload
- Checks for duplicates
- Assigns table(s) using priority rules
- Creates record in Airtable
- Returns success response to Calendly

### Step 4: Record Appears in Airtable
- New reservation record created
- Shows up when you refresh the React app

---

## Current Problem

**You see:**
- Only 1 log: `/api/logs` endpoint error (NOT_AUTHORIZED from Airtable)
- **NO logs for `/api/webhook/calendly`** ← This means Calendly isn't calling your webhook

**This means:**
- ❌ Webhook subscription might not exist in Calendly
- ❌ OR webhook subscription exists but is disabled (due to failures)
- ❌ OR webhook URL is wrong

---

## How to Check Webhook Status

### Option 1: Check via Calendly API (Recommended)

Run this script to list all webhooks:

```bash
cd "C:\Users\Work\Desktop\3echo\The Upper Room\upper-room-floor-plan\api"
node check-webhooks.js
```

I'll create this script for you.

### Option 2: Check Vercel Logs

1. Go to Vercel Dashboard → `upper-room-calendly-server` project
2. Go to **Logs** tab
3. Filter by route: `/api/webhook/calendly`
4. If you see logs when booking → webhook is working
5. If NO logs → webhook isn't being called

### Option 3: Test Webhook Endpoint Manually

Test if the endpoint exists and responds:

```bash
curl -X POST https://upper-room-calendly-server-5qy349sza-3echos-projects.vercel.app/api/webhook/calendly \
  -H "Content-Type: application/json" \
  -d '{"event":"invitee.created","payload":{"name":"Test"}}'
```

---

## Most Likely Issues

1. **Webhook subscription doesn't exist** → Need to create it
2. **Webhook is disabled** (due to previous failures) → Need to recreate it
3. **Webhook URL is wrong** → Need to update it
4. **Endpoint doesn't exist on Vercel** → Need to redeploy

---

## Next Steps

1. I'll create a script to check webhook status
2. Then we'll recreate the webhook if needed
3. Then test with a booking

