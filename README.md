# CielOnline

An all-in-one business management platform for service-based businesses. Built with React 18, Vite, and Supabase.

Live at **cielonline.com** — hosted on Vercel.

## Features

- **Admin Dashboard** — Overview analytics, revenue tracking, appointment calendar
- **Customer CRM** — Customer records, notes, multi-service job tracking with completion history
- **Website Builder** — Drag-and-drop site editor with block-based templates for client websites
- **QR Code Studio** — Generate and manage branded QR codes with scan analytics
- **Digital Business Cards** — Hosted card pages with vCard downloads
- **Payments** — Square and Stripe integrations via Supabase Edge Functions
- **Inquiry Management** — Form submissions from client sites with status tracking
- **External Site Control** — Manage content on client websites (e.g. vividautodetails.com) via `bridge.js`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + React Router 6 |
| Build | Vite 5 |
| Backend | Supabase (Postgres, Auth, RLS, Realtime, Storage) |
| Payments | Square OAuth + Stripe Connect via Edge Functions |
| Email | Resend via Supabase Edge Functions |
| Hosting | Vercel |

## Project Structure

```
├── index.html                 # Vite entry (React app)
├── landing.html               # Marketing landing page
├── vite.config.js             # Vite config (multi-page)
├── package.json
├── public/
│   └── bridge.js              # Script loaded on external client sites
├── src/
│   ├── App.jsx                # Router & auth wrapper
│   ├── main.jsx               # React entry point
│   ├── components/            # UI components
│   │   └── admin/             # Dashboard tab panels
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Supabase client, API helpers, templates
│   ├── pages/                 # Route-level page components
│   ├── styles/                # CSS
│   └── utils/                 # Utility functions
├── supabase/
│   └── functions/             # Edge Functions (payments, webhooks, email)
├── cards/                     # Static business card pages
├── BACKEND_SCHEMA.md          # Complete Supabase schema & disaster recovery reference
├── SETUP_INSTRUCTIONS.md      # Step-by-step project setup guide
└── Ui-rules.txt               # Design system guidelines
```

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
```

Requires a `.env` file with Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

See `SETUP_INSTRUCTIONS.md` for full setup including Supabase tables, auth, payments, and deployment.

## Database

The Supabase backend has 14 tables, Row Level Security on every table, realtime subscriptions, and storage buckets. See `BACKEND_SCHEMA.md` for the complete schema — it serves as a disaster recovery reference if the database ever needs to be rebuilt.

## Deployment

The app is deployed to Vercel. Push to `main` to trigger a production build.

```bash
npm run build      # outputs to dist/
```

## License

© 2025 CielOnline. All rights reserved.
