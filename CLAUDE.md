# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture Overview

This is a React + TypeScript landing page for an AI-powered book generation platform (Proofbound.com) with the following key architectural components:

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

## Project Architecture Strategy

### Current Infrastructure
- **Marketing Site**: `proofbound-web` (Quarto static site) at proofbound.com
- **Web App**: This repository at app.proofbound.com (Netlify)
- **API Backend**: `hal9ai/customer-books` at api.hal9.com/books/bookgeneratorapi/proxy/
- **Database**: Supabase with `form_submissions` table
- **Payments**: Stripe integration (test/production modes)

### Development Migration Plan
**Goal**: Move from Bolt.new development to VS Code-based development while preserving working Stripe/auth/generation flows.

**Phase 1**: API Integration Enhancement
- Update API client to use all available HAL9 endpoints:
  - `POST /toc` - Generate table of contents
  - `POST /generate-book-chapters` - Generate TOC + selected chapters (stateless)
  - `POST /pdf` - Convert Markdown to PDF
  - `POST /cover` - Generate book cover
- Hook up missing endpoints in existing UX flows
- See status of proofbound-api in /backup/misc/api-claude.md

**Phase 2**: Demo Route Implementation  
- Add `/demo` route as lead generation strategy
- Enable users to generate demo books without login
- Start with small curated examples (e.g. see /backup/misc/presets.py and routes.py)
- Curated preset examples showcasing AI capabilities
- Conversion funnel: Demo → "Save/Customize This" → Account Creation → Payment

**Phase 2**: Testing Infrastructure
- Component tests with mocked APIs (fast)
- E2E tests with Stripe test mode (selective)
- Demo route doubles as development testing tool
- Real API integration testing without manual data entry

### API Integration
**HAL9 Endpoints**: `https://api.hal9.com/books/bookgeneratorapi/proxy/`
- All endpoints already implemented in `hal9ai/customer-books`
- Stateless design - include all context in API calls
- Cost optimization through caching and selective chapter generation

### Database Strategy
**Minimal Schema Changes**: Extend existing `form_submissions` table rather than major migration
```sql
-- Add JSON column for generated content
ALTER TABLE public.form_submissions 
ADD COLUMN generated_content JSONB DEFAULT '{}';
```

**Book Object Structure** (stored in `generated_content` JSONB):
```typescript
interface GeneratedContent {
  toc?: TableOfContents
  chapters: { [chapterNumber: number]: ChapterData }
  assets: { cover_urls?: {}, pdf_urls?: {} }
  generation_log: { api_calls: [], total_cost_usd?: number }
}
```

### Demo Route Strategy
**Purpose**: Lead generation + development testing tool
- **Public Access**: No login required for curated demos  
- **Preset Examples**: High-quality book concepts across different genres
- **Conversion Triggers**: "Generate YOUR book" → account creation → payment
- **Cost Management**: Cache demo responses, rate limit custom generation

**User Journey Transformation**:
```
Old: Landing → Payment → Hope product is good
New: Landing → Demo (proof of quality) → "Make your own" → Payment
```

### Testing Philosophy
- **Fast Tests**: Unit/component tests with mocked APIs and Supabase
- **Integration Tests**: Real Stripe test payments, selective API calls
- **Demo Route**: Serves as both user feature and development testing tool
- **Manual Testing**: Weekly full-flow verification with real generation

## Development Notes

- Uses Tailwind CSS for styling
- TypeScript with strict configuration
- Supabase for auth, database, and serverless functions
- Stripe for payment processing (preserve existing integration)
- HAL9 integration for AI book generation via existing API
- Email notifications via Resend/SendGrid
- **Migration Priority**: Preserve working Stripe/auth flows, enhance with better API integration and demo features

## Key Principles

1. **Preserve What Works**: Don't break existing Stripe integration, user auth, or database schema
2. **Stateless API Design**: Include all context in API calls, avoid session dependencies
3. **Demo-Driven Development**: Use demo route for both user acquisition and development testing
4. **Cost Optimization**: Cache responses, selective generation, efficient API usage
5. **Progressive Enhancement**: Add features incrementally without disrupting core flows
