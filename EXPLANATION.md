# What Happened - Folder Confusion Explanation

## The Situation

### What EXISTS on Vercel (Deployed):
- ✅ `/api/webhook/calendly` endpoint - **EXISTS and responds** (but returns 500 error)
- ✅ `/api/health` endpoint - Working
- ✅ `/api/logs` endpoint - Working

### What EXISTS Locally (in `upper-room-floor-plan/api/`):
- ✅ `check-webhooks.js` - Script to list webhooks
- ✅ `create-webhook.js` - Script to create webhook subscription
- ✅ `test-airtable-key.js` - Test Airtable credentials
- ✅ `test-server.js` - Test all endpoints
- ✅ `test-connection.js` - Test connection endpoint (not deployed yet)
- ❌ `api/webhook/calendly.js` - **MISSING** (was deleted)
- ❌ `api/lib/airtable.js` - **MISSING** (was deleted)
- ❌ `api/lib/assignment.js` - **MISSING** (was deleted)
- ❌ `api/lib/utils.js` - **MISSING** (was deleted)
- ❌ `vercel.json` - **MISSING** (was deleted)

## Why This Happened

1. **The webhook code WAS created** earlier in our conversation
2. **It WAS deployed to Vercel** (that's why the endpoint exists)
3. **The files were DELETED locally** (probably accidentally or during cleanup)
4. **Vercel still has the OLD deployed code running**

## The Problem

The deployed code on Vercel:
- ✅ Exists and responds to requests
- ❌ Is getting "NOT_AUTHORIZED" errors from Airtable
- ❌ Might be using old/broken code
- ❌ Might not be reading environment variables correctly

## What We Need To Do

**Option 1: Recreate the webhook code** (Recommended)
- Recreate `api/webhook/calendly.js` and supporting files
- Deploy them to Vercel to replace the broken code
- This will fix the "not authorized" error

**Option 2: Check what's deployed**
- Go to Vercel Dashboard → View Source
- See what code is actually running
- Debug from there

## Current Status

✅ Environment variables: SET correctly in Vercel
✅ Webhook subscription: EXISTS and active in Calendly
✅ Endpoint: EXISTS on Vercel (but broken)
❌ Endpoint code: MISSING locally, BROKEN on Vercel

## Next Steps

I can recreate the webhook endpoint code based on what it should do:
1. Receive Calendly webhook payload
2. Extract booking data
3. Assign tables using priority rules
4. Create reservation in Airtable
5. Handle cancellations

Would you like me to recreate the webhook code files?
