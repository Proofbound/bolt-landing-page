# Proofbound Bolt Landing Page

A modern, AI-powered book generation platform that transforms your expertise into professional publications. Built with React, TypeScript, Supabase, and Stripe, this project provides a seamless user experience from landing page to book delivery.

---

## 🚀 Features
- **Landing Page** with email capture and conversion-focused design
- **User Authentication** (signup/login) via Supabase
- **Stripe Payments** for book generation services
- **AI Book Generator** (HAL9 integration)
- **Admin Dashboard** for managing submissions ([see admin instructions](./README-ADMIN.md))
- **Email Notifications** for new submissions (admin + customer)
- **Real-time Status Updates** for book requests

---

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Supabase (Edge Functions, Database)
- **Payments:** Stripe
- **Email:** Resend (or SendGrid, configurable)

---

## 🧑‍💻 Local Development

1. **Clone the repo:**
   ```sh
   git clone https://github.com/Proofbound/bolt-landing-page.git
   cd bolt-landing-page
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your keys:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_HAL9_TOKEN=your_hal9_token_here
     ```
   - For backend/email/Stripe, see [EMAIL_SETUP.md](./EMAIL_SETUP.md)
4. **Start the dev server:**
   ```sh
   npm run dev
   ```

---

## 🏗️ Deployment
- **Frontend:** Deploy to Netlify, Vercel, or similar (static build via Vite)
- **Backend:** Supabase Edge Functions (see `supabase/functions/`)
- **Environment variables:** Set in your deployment provider and Supabase dashboard

---

## 📂 Project Structure
- `src/` — React app source code
- `supabase/functions/` — Edge Functions (API, email, Stripe, AI, etc.)
- `public/` — Static assets
- `backup/` — Project backup and Stripe config
- `admin.html` — Standalone admin dashboard (see [README-ADMIN.md](./README-ADMIN.md))

---

## 📚 More Documentation
- [Admin Dashboard Guide](./README-ADMIN.md)
- [Email Setup](./EMAIL_SETUP.md)
- [Backup/Project Overview](./BACKUP_README.md)

---

## 📝 License
Copyright (c) Proofbound. All rights reserved.
