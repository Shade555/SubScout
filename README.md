# SubScout

A React-based web app for subscription management, built for HackXios 2k25 hackathon.

## Features

- 🎯 **Centralized Dashboard**: Track all your subscriptions in one place
- 📅 **Payment Reminders**: Get notified via browser, push, and email notifications
- 💰 **Multi-Currency Support**: View totals in 9+ major currencies with real-time conversion
- 📱 **Mobile Responsive**: Beautiful design that works on all devices
- 🔐 **Secure Authentication**: Email/password and Google OAuth integration
- ⚡ **Real-time Updates**: Instant sync across all your devices

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your actual values:

```bash
cp .env.example .env.local
```

You'll need to obtain:
- **Supabase credentials**: Create a project at [supabase.com](https://supabase.com)
- **Google OAuth credentials**: Set up at [Google Cloud Console](https://console.cloud.google.com)
- **Resend API key**: Get from [resend.com](https://resend.com) for email notifications
- **VAPID keys**: Generate at [web-push-codelab.glitch.me](https://web-push-codelab.glitch.me) for push notifications

### 2. Database Setup

1. Run the SQL scripts in your Supabase SQL Editor:
   - `supabase-setup.sql` - Main database schema
   - `supabase-notifications-setup.sql` - Notification preferences
   - `supabase-add-last-payment-date.sql` - Payment tracking

### 3. Edge Functions (for Email Notifications)

Deploy the email notification function:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy send-notification-email
```

See `deploy-edge-function.md` for detailed instructions.

### 4. Install and Run

```bash
npm install
npm run dev
```

## Tech Stack

- **Frontend**: React, Vite, CSS3
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Notifications**: Web Push API, Resend Email API
- **Authentication**: Supabase Auth with Google OAuth
- **Deployment**: Vercel/Netlify compatible

## Project Structure

```
src/
├── components/          # React components
├── services/           # API and business logic
├── contexts/           # React contexts
└── lib/               # Utilities and configurations

supabase/
├── functions/         # Edge Functions
└── *.sql             # Database schemas
```

## Contributing

This project was built for HackXios 2k25. Feel free to fork and improve!