# Edge Function Debugging Guide - No Logs Issue

## Issue: No Logs Appearing in Deployed Function

If you're not seeing any logs, it usually means:
1. Function isn't being invoked at all
2. Function deployment failed
3. Function name mismatch
4. Network/routing issue

## Step 1: Verify Function Deployment

First, let's deploy both a simple test function and the email function:

```bash
# Deploy the simple test function first
supabase functions deploy test-simple

# Then deploy the email function
supabase functions deploy send-notification-email
```

## Step 2: Test Simple Function First

1. **Go to:** https://YOUR_PROJECT_REF.supabase.co/project/YOUR_PROJECT_REF/functions
2. **Verify both functions are listed:**
   - `test-simple`
   - `send-notification-email`

3. **Test the simple function first:**
   ```bash
   curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/test-simple' \
     -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
     -H 'Content-Type: application/json'
   ```

4. **Check logs for test-simple:**
   - Go to Logs → Edge Functions
   - Select `test-simple`
   - You should see logs like "SIMPLE TEST FUNCTION START"

## Step 3: Check Function URLs

Make sure you're using the correct URLs:
- **Simple test:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/test-simple`
- **Email function:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-email`

## Step 4: Verify Environment Variables

**Go to:** https://YOUR_PROJECT_REF.supabase.co/project/YOUR_PROJECT_REF/settings/functions

**Add these environment variables:**
```
RESEND_API_KEY = your_resend_api_key_here
SITE_URL = http://localhost:5173
```

**CRITICAL:** After adding environment variables, you MUST redeploy:
```bash
supabase functions deploy send-notification-email
```

## Step 5: Test Email Function with Detailed Logging

The updated email function has step-by-step logging. Test it:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-email' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "test@example.com",
    "subscription": {
      "name": "Test Service",
      "amount": 9.99,
      "currency": "USD",
      "billing_cycle": "monthly",
      "next_payment_date": "2025-01-02"
    },
    "daysUntil": 1
  }'
```

You should see logs like:
- "EMAIL FUNCTION START"
- "Step 1: Reading request body..."
- "Step 2: Parsing JSON..."
- etc.

## Step 6: Common "No Logs" Issues

### Issue 1: Function Not Deployed
**Check:** Function appears in Supabase dashboard
**Solution:** Run `supabase functions deploy send-notification-email`

### Issue 2: Wrong Function Name
**Check:** Function name is exactly `send-notification-email`
**Solution:** Verify in dashboard and redeploy if needed

### Issue 3: Network/CORS Issues
**Check:** Browser network tab shows 200 response
**Solution:** Check CORS headers and request format

### Issue 4: Supabase CLI Not Linked
**Check:** Run `supabase status` to verify connection
**Solution:** 
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Issue 5: Function Crashes Immediately
**Check:** Function logs show error on startup
**Solution:** Check TypeScript/Deno syntax errors

## Step 7: Manual Deployment Verification

1. **Check deployment status:**
   ```bash
   supabase functions list
   ```

2. **Check function details:**
   ```bash
   supabase functions inspect send-notification-email
   ```

3. **View recent deployments:**
   - Go to Supabase dashboard
   - Functions → send-notification-email
   - Check "Deployments" tab

## Step 8: Browser Testing

Use the enhanced `test-supabase-function.html`:
1. Open the file in browser
2. Open browser dev tools (F12)
3. Go to Console tab
4. Click "Test Edge Function"
5. Watch for detailed request/response logs

## Step 9: What to Check Next

If still no logs after following these steps:

1. **Verify project ID:** YOUR_PROJECT_REF
2. **Check Supabase status:** https://status.supabase.com/
3. **Try different browser/incognito mode**
4. **Check firewall/proxy settings**

## Quick Deployment Commands

```bash
# Full deployment sequence
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy test-simple
supabase functions deploy send-notification-email

# Verify deployment
supabase functions list
```

## Expected Log Output

When working correctly, you should see logs like:
```
EMAIL FUNCTION START
Method: POST
URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-email
Step 1: Reading request body...
Raw body length: 234
Step 2: Parsing JSON...
Parsed body keys: ["to", "subscription", "daysUntil"]
Step 3: Validating request data...
Request validation passed: {"to":"test@example.com","subscriptionName":"Test Service","daysUntil":1}
```