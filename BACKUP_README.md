# Proofbound Project Backup
**Created:** January 25, 2025
**Repository:** github.com/Proofbound/bolt-landing-page

## Project Overview
AI-powered book generation platform that transforms domain expertise into professional publications. Built with React, TypeScript, Supabase, and Stripe integration.

## Key Features
- Landing page with email capture form
- User authentication (signup/login)
- Stripe payment integration for book services
- AI book generator with HAL9 integration
- Admin dashboard for managing submissions
- Email notifications for new submissions

## Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_HAL9_TOKEN=your_hal9_token_here
```

## Supabase Environment Variables
```
RESEND_API_KEY=your_resend_api_key_here
ADMIN_EMAIL=your-email@proofbound.com
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
VITE_HAL9_TOKEN=your_hal9_token_here
```

## Database Schema
- Users table with authentication integration
- Form submissions with status tracking
- Stripe integration (customers, subscriptions, orders)
- Email notification triggers

## Deployment
- **Frontend:** Netlify (connected to github.com/Proofbound/bolt-landing-page)
- **Backend:** Supabase Edge Functions
- **Database:** Supabase PostgreSQL
- **Payments:** Stripe

## Current Status
- ✅ Landing page functional
- ✅ User authentication working
- ✅ Form submissions saving to database
- ✅ Stripe payment integration active
- ✅ Email notifications configured
- ⚠️ AI book generator needs HAL9 API debugging
- ✅ Admin dashboard operational

## Next Steps
1. Debug HAL9 API integration in Edge Functions
2. Test complete book generation workflow
3. Verify email notifications are working
4. Test Stripe webhook handling

## File Structure
```
/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── [other components]
│   ├── hooks/
│   ├── lib/
│   └── [other source files]
├── supabase/
│   ├── functions/
│   └── migrations/
├── public/
└── [config files]
```

## Important Notes
- Repository moved from richardsprague/proofbound to Proofbound/bolt-landing-page
- Netlify deployment working correctly
- Bolt needs repository connection update
- All sensitive keys stored in environment variables