# Email Notifications Setup with Resend

## Step 1: Set Environment Variables in Supabase

You need to add your Resend API key to Supabase Edge Functions:

1. **Go to your Supabase Dashboard:**
   - Visit: https://qjulzbbwfdqwrybkhpoj.supabase.co/project/qjulzbbwfdqwrybkhpoj/settings/functions

2. **Add Environment Variables:**
   - Click on "Environment Variables" or "Secrets"
   - Add these variables:
   ```
   RESEND_API_KEY = re_h64eVn47_NBKh3CjYCn6HjUbEubNDfadi
   SITE_URL = http://localhost:5173
   ```

## Step 2: Deploy the Edge Function

Deploy the updated Edge Function to Supabase:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref qjulzbbwfdqwrybkhpoj

# Deploy the function
supabase functions deploy send-notification-email
```

## Step 3: Test Email Notifications

1. **Go to Notification Settings** in your app
2. **Enable Email Notifications**
3. **Click "Test Email"** button
4. **Check your email** (including spam folder)

## Step 4: Set Up Custom Domain (Optional)

For production, you should set up a custom domain with Resend:

1. **Go to Resend Dashboard:** https://resend.com/domains
2. **Add your domain** (e.g., yourdomain.com)
3. **Verify DNS records**
4. **Update the Edge Function** to use your domain:
   ```typescript
   from: 'SubScout <notifications@yourdomain.com>'
   ```

## Troubleshooting

### If emails aren't sending:

1. **Check Supabase Logs:**
   - Go to: https://qjulzbbwfdqwrybkhpoj.supabase.co/project/qjulzbbwfdqwrybkhpoj/logs/edge-functions
   - Look for errors in the `send-notification-email` function

2. **Check Resend Dashboard:**
   - Visit: https://resend.com/emails
   - Check if emails are being sent but not delivered

3. **Verify Environment Variables:**
   - Make sure `RESEND_API_KEY` is set correctly in Supabase
   - Check that the API key is active in Resend

### Common Issues:

- **"Domain not verified"**: Use `onboarding@resend.dev` for testing
- **"API key invalid"**: Double-check the API key in Supabase settings
- **"Function not found"**: Make sure the Edge Function is deployed

## Email Template Features

The email includes:
- 📧 **Professional HTML template** with SubScout branding
- 💰 **Subscription details** (name, amount, billing cycle)
- 📅 **Payment due date** with urgency indicators
- 🔗 **Link back to your app**
- ⚙️ **Unsubscribe information**

## Next Steps

Once emails are working:
1. **Set up automatic notifications** based on subscription due dates
2. **Customize email templates** for different notification types
3. **Add email analytics** to track open rates
4. **Set up custom domain** for professional emails