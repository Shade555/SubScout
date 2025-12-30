# Database Setup Instructions

The notification toggles aren't being saved because the database tables don't exist yet. Follow these steps:

## Step 1: Run SQL Setup in Supabase

1. Go to your Supabase SQL Editor:
   https://YOUR_PROJECT_REF.supabase.co/project/YOUR_PROJECT_REF/sql

2. Copy the entire contents of `supabase-notifications-setup.sql` file

3. Paste it into the SQL editor and click "Run"

This will create:
- `user_preferences` table (stores notification settings)
- `push_subscriptions` table (stores push notification subscriptions)
- `notification_logs` table (tracks sent notifications)
- Row Level Security policies
- Automatic triggers for new users

## Step 2: Test the Notification Settings

After running the SQL:

1. Start your development server: `npm run dev`
2. Go to the notification settings page
3. Toggle the notification preferences
4. Check the browser console for any errors
5. The settings should now be saved to your user profile

## What was fixed:

1. **Improved error handling** - Better user feedback when things go wrong
2. **Robust preference updates** - Handles cases where user preferences don't exist yet
3. **Default values** - Ensures the app works even if database calls fail
4. **Better loading states** - Shows proper loading and saving indicators

## Troubleshooting:

If you still see issues after running the SQL:
- Check the browser console for specific error messages
- Verify you're logged in with a valid user account
- Make sure the SQL ran without errors in Supabase