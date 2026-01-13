# Vercel Environment Variables Setup

## Current Issue

The `/api/logs` endpoint is returning `NOT_AUTHORIZED` from Airtable, which means:
- The webhook endpoint exists ✅
- But it can't access Airtable ❌

## Required Environment Variables

You need to set these in Vercel Dashboard:

1. **AIRTABLE_API_KEY**
   - Value: `patFAhxAehjS7ooW4.065ff8cc4680ea7a527f2315d465c76dc530b6fd692f4ad456ca75bd9aa1af9d`
   - Used by: All API endpoints (webhook, logs, etc.)

2. **AIRTABLE_BASE_ID**
   - Value: `appHXyKvdB7cU3qF7`
   - Used by: All API endpoints

3. **CALENDLY_API_KEY** (optional, for future use)
   - Value: Your Calendly Personal Access Token
   - Used by: Manual sync or other features

## How to Set Environment Variables

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select project: **`upper-room-calendly-server`**

### Step 2: Add Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add each variable:
   - **Key**: `AIRTABLE_API_KEY`
   - **Value**: `patFAhxAehjS7ooW4.065ff8cc4680ea7a527f2315d465c76dc530b6fd692f4ad456ca75bd9aa1af9d`
   - **Environment**: Production, Preview, Development (check all)
4. Click **Save**
5. Repeat for `AIRTABLE_BASE_ID`: `appHXyKvdB7cU3qF7`

### Step 3: Redeploy (if needed)
- Environment variables are applied immediately to new deployments
- If you want to apply to current deployment, go to **Deployments** tab
- Click **Redeploy** on the latest deployment

## Verification

After setting environment variables, test:
1. Make a test booking on Calendly
2. Check Vercel Logs for `/api/webhook/calendly` requests
3. Check for errors - should NOT see `NOT_AUTHORIZED`
4. Check Airtable - reservation should appear

## Current Status

✅ Webhook subscription created and active
✅ Webhook endpoint exists on Vercel
⚠️  Need to verify/fix Airtable API key in Vercel

