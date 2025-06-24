# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture Overview

This is a React + TypeScript landing page for an AI-powered book generation platform (Proofbound Bolt) with the following key architectural components:

### Frontend (React/Vite)
- **Main App**: `src/App.tsx` - Router setup with authentication routes
- **Authentication**: JWT-based auth via Supabase (`src/hooks/useAuth.ts`)
- **Protected Routes**: `src/components/auth/ProtectedRoute.tsx`
- **Payment Flow**: Stripe checkout integration (`src/hooks/useStripeCheckout.ts`)

### Key Components Structure
- `src/components/Hero.tsx` - Landing page hero section
- `src/components/EmailCapture.tsx` - Lead capture form
- `src/components/PricingTiers.tsx` - Stripe-integrated pricing
- `src/components/AIBookGenerator.tsx` - Main book generation interface
- `src/components/dashboard/Dashboard.tsx` - User dashboard post-auth
- `src/components/auth/` - Login/signup pages

### Backend (Supabase Edge Functions)
- **Database**: Stripe customer/subscription/order tables with typed schema in `src/lib/supabase.ts`
- **Edge Functions** (`supabase/functions/`):
  - `stripe-checkout/` - Payment processing
  - `stripe-webhook/` - Stripe event handling
  - `generate-content/`, `generate-cover/`, `generate-pdf/`, `generate-toc/` - AI book generation pipeline
  - `send-submission-email/` - Email notifications
  - `admin-submissions/` - Admin data access

### State Management
- React hooks for local state management
- Custom hooks in `src/hooks/`:
  - `useAuth.ts` - Authentication state
  - `useBookGeneration.ts` - Book creation workflow
  - `useStripeCheckout.ts` - Payment processing
  - `useSubscription.ts` - Subscription management

### Environment Variables Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_HAL9_TOKEN` - HAL9 AI service token

### Admin Interface
- Standalone `admin.html` for managing submissions (see README-ADMIN.md)
- Admin dashboard accessible via `/admin` route in React app

## Development Notes

- Uses Tailwind CSS for styling
- TypeScript with strict configuration
- Supabase for auth, database, and serverless functions
- Stripe for payment processing
- HAL9 integration for AI book generation
- Email notifications via Resend/SendGrid