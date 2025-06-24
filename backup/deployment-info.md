# Deployment Information

## Current Deployment Status
- **Frontend:** Successfully deployed on Netlify
- **Repository:** github.com/Proofbound/bolt-landing-page
- **Domain:** [Your Netlify domain]
- **Build Status:** ✅ Working

## Netlify Configuration
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 18.x
- **Environment Variables Required:**
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY

## Supabase Configuration
- **Project:** [Your Supabase project]
- **Database:** PostgreSQL with RLS enabled
- **Edge Functions:** 6 functions deployed
- **Storage:** Not currently used

## Edge Functions Status
1. ✅ stripe-checkout - Payment processing
2. ✅ stripe-webhook - Webhook handling
3. ✅ send-submission-email - Email notifications
4. ✅ admin-submissions - Admin dashboard
5. ⚠️ generate-toc - TOC generation (needs HAL9 debugging)
6. ⚠️ generate-content - Content generation (needs HAL9 debugging)
7. ⚠️ generate-cover - Cover generation (needs HAL9 debugging)
8. ⚠️ generate-pdf - PDF generation (needs HAL9 debugging)

## Known Issues
1. HAL9 API integration needs debugging in Edge Functions
2. Bolt repository connection needs updating to new GitHub location
3. AI book generator workflow needs testing

## Environment Variables Checklist
### Frontend (.env)
- [x] VITE_SUPABASE_URL
- [x] VITE_SUPABASE_ANON_KEY
- [x] VITE_HAL9_TOKEN

### Supabase (Project Settings)
- [x] STRIPE_SECRET_KEY
- [x] STRIPE_WEBHOOK_SECRET
- [x] RESEND_API_KEY
- [x] ADMIN_EMAIL
- [x] VITE_HAL9_TOKEN

## Backup Created
- Date: January 25, 2025
- All source files backed up
- Database schema exported
- Configuration documented
- Deployment status recorded