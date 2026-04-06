# Cielonline â€” Complete Setup Instructions

## Overview

Cielonline is an administration platform for businesses. After setup, users can:
- **Log in** to the admin portal
- **View their website** built by Cielonline
- **Track inquiries** from their website contact forms
- **Manage customers** (full CRM with vehicle info, notes, tags)
- **Schedule appointments** with a visual calendar
- **Manage services** they offer (name, price, duration)
- **View analytics** (inquiry trends, appointment stats, conversion rates)
- **Receive email notifications** when new inquiries/appointments come in

The first connected website is **vividautodetails.com** (car detailing).

For long-term multi-site operations, prefer **Vercel** over GitHub Pages for client websites that need embedded live previews inside Cielonline. GitHub Pages is acceptable for a simple static launch, but Vercel gives you better control over preview deployments, headers, and future operational flexibility.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend / DB | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel |
| Email | Resend (via Supabase Edge Functions) |
| Payments | Square |
| Domain | cielonline.com |

---

## Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Choose your organization
4. Enter:
   - **Project name**: `cielonline` (or whatever you want)
   - **Database password**: save this in a secure place
   - **Region**: choose closest to your users
5. Wait until project status = **healthy/ready**

### 2. Get Your API Keys

In Supabase dashboard:
1. Go to **Project Settings â†’ API**
2. Copy these two values:
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **Project API key â†’ anon public** (starts with `eyJ...`)

### 3. Create `.env` File

Create a file named `.env` in the project root (same level as `package.json`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

You can also start from `.env.example` in the repo.

### 4. Run the Database SQL

Open **SQL Editor â†’ New query** in your Supabase dashboard.

Copy the **Complete SQL Schema** block from [`BACKEND_SCHEMA.md`](BACKEND_SCHEMA.md) and run it.
Then run the **Storage Buckets** block from the same file.
Then run the **Realtime Configuration** block.

After running all three, use the **Post-Setup Verification** queries at the bottom of that file to confirm everything was created.

### 5. Configure Payment Processing (Square + Stripe)

Cielonline supports two payment providers. Square is the recommended primary option, with Stripe available as an alternative. Clients connect by clicking a button and logging in â€” no manual database work.

**How it works for clients:** In the admin Payments tab, the client clicks "Connect Square" or "Connect Stripe". A login window opens. They sign into their own account. Credentials are saved automatically. Done.

#### 5a. Square (Primary â€” Recommended)

Create one Square Application for Cielonline in the [Square Developer Dashboard](https://developer.squareup.com).

Required Supabase secrets for Square:

1. `SQUARE_APPLICATION_ID`
2. `SQUARE_APPLICATION_SECRET`
3. `SQUARE_ENVIRONMENT` (`sandbox` for testing, `production` for live)
4. `SQUARE_WEBHOOK_SIGNATURE_KEY`
5. `FRONTEND_ORIGIN` (e.g. `https://cielonline.com`)

Deploy Square edge functions:

```bash
supabase functions deploy create-square-oauth-link
supabase functions deploy square-oauth-callback
supabase functions deploy create-square-checkout-link
supabase functions deploy square-webhook
```

In the Square Developer Dashboard, configure:

1. **OAuth Redirect URL**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/square-oauth-callback`
2. **Webhook URL**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/square-webhook`

Subscribe the webhook to: `payment.completed`, `payment.updated`, `refund.created`, `refund.updated`, `oauth.authorization.revoked`

#### 5b. Stripe (Alternative Option)

Create one platform Stripe account for Cielonline using [Stripe Connect Standard](https://stripe.com/connect).

Required Supabase secrets for Stripe:

1. `STRIPE_SECRET_KEY`
2. `STRIPE_WEBHOOK_SECRET`

Deploy Stripe edge functions:

```bash
supabase functions deploy create-stripe-account-link
supabase functions deploy create-stripe-checkout-link
supabase functions deploy stripe-webhook
```

In the Stripe Dashboard, add a webhook endpoint:

```text
https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
```

Subscribe to: `checkout.session.completed`, `payment_intent.payment_failed`, `account.updated`

#### Shared edge functions (deploy regardless of provider):

```bash
supabase functions deploy notify-admin
supabase functions deploy create-public-booking-checkout
```

#### Required Supabase secrets (always needed):

1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `RESEND_API_KEY` (email notifications)
5. `ADMIN_NOTIFICATION_EMAIL` (email notifications)

#### How automatic connection works:

1. Client clicks "Connect Square" or "Connect Stripe" in the Payments tab.
2. An OAuth/onboarding window opens â€” the client logs into their own account.
3. Credentials are saved to `client_sites.settings` automatically by the callback.
4. **Nothing is manually entered into the database.**
5. When both Square and Stripe are connected, Square is used as the default for checkout links.

### 6. Move Vivid to Vercel

When moving Vivid from GitHub Pages to Vercel:

1. deploy the static Vivid site to Vercel
2. update the client site `site_url` in Cielonline Overview
3. point the custom domain DNS to Vercel
4. confirm the bridge script still loads correctly
5. confirm the Visual Canvas iframe preview loads on the Vercel URL

### 7. Local Preview

Run the app locally:

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

### 8. Seed the First Client Site (Vivid Auto Details)

After running the schema SQL above, you need to create a user account and assign the Vivid Auto Details site. Run this in the SQL Editor **AFTER** you have created your user account (via the /login page):

```sql
-- First, find your user ID. Replace with your actual email:
-- SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';

-- Then insert the site (replace YOUR_USER_ID with the UUID from above):
INSERT INTO public.client_sites (owner_id, site_name, site_url, slug, description, business_type)
VALUES (
  'YOUR_USER_ID',
  'Vivid Auto Details',
  'https://vividautodetails.com',
  'vivid-auto-details',
  'Professional car detailing services',
  'auto_detailing'
);

-- Optionally, add some starter services:
INSERT INTO public.services (site_id, name, description, price, duration_minutes, sort_order) VALUES
  ((SELECT id FROM public.client_sites WHERE slug = 'vivid-auto-details'), 'Basic Wash', 'Exterior hand wash, wheel cleaning, tire dressing', 49.99, 45, 1),
  ((SELECT id FROM public.client_sites WHERE slug = 'vivid-auto-details'), 'Interior Detail', 'Full interior vacuum, wipe down, carpet shampoo, leather conditioning', 129.99, 90, 2),
  ((SELECT id FROM public.client_sites WHERE slug = 'vivid-auto-details'), 'Exterior Detail', 'Clay bar, polish, wax, trim restoration', 149.99, 120, 3),
  ((SELECT id FROM public.client_sites WHERE slug = 'vivid-auto-details'), 'Full Detail Package', 'Complete interior + exterior detail with ceramic spray sealant', 249.99, 180, 4),
  ((SELECT id FROM public.client_sites WHERE slug = 'vivid-auto-details'), 'Ceramic Coating', 'Professional ceramic coating application with 2-year warranty', 499.99, 300, 5),
  ((SELECT id FROM public.client_sites WHERE slug = 'vivid-auto-details'), 'Paint Correction', 'Multi-stage paint correction to remove swirls, scratches, and oxidation', 349.99, 240, 6);
```

### 9. Configure Auth

In Supabase dashboard:
1. Go to **Authentication â†’ Providers**
2. Open **Email** provider
3. Enable:
   - Email/Password âœ…
   - Magic Link âœ… (optional)
4. Save

For easier testing, you can temporarily disable **"Confirm email"** in Auth settings.

### 10. Set Auth URLs

Go to **Authentication â†’ URL Configuration**:

**Site URL**: `http://localhost:5173`

**Additional Redirect URLs** (add each one):
- `http://localhost:5173/dashboard`
- `http://localhost:5173/admin`
- `https://YOUR-VERCEL-DOMAIN.vercel.app/dashboard`
- `https://YOUR-VERCEL-DOMAIN.vercel.app/admin`
- `https://cielonline.com/dashboard`
- `https://cielonline.com/admin`

### 11. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
4. Deploy

### 12. Set Up Email Notifications (Resend + Supabase Edge Functions)

This allows the admin to receive emails when new inquiries or appointments come in.

#### 9a. Set up Resend

1. Go to [https://resend.com](https://resend.com) and create a free account
2. Add and verify your domain (`cielonline.com`) â€” or use a free `onboarding@resend.dev` for testing
3. Go to **API Keys** and create an API key
4. Copy the API key

#### 9b. Install Supabase CLI

```bash
npm install -g supabase
```

#### 9c. Link your Supabase project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Your project ref is visible in the URL when you open your Supabase project:
`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

#### 9d. Set Edge Function Secrets

```bash
supabase secrets set RESEND_API_KEY=re_YOUR_RESEND_API_KEY
supabase secrets set ADMIN_NOTIFICATION_EMAIL=your@email.com
```

#### 9e. Deploy the Edge Function

```bash
supabase functions deploy notify-admin
```

#### 9f. Create Database Webhooks

In Supabase dashboard:
1. Go to **Database â†’ Webhooks** (or **Integrations â†’ Webhooks**)
2. Create **first webhook**:
   - Name: `notify-on-new-inquiry`
   - Table: `inquiries`
   - Events: `INSERT`
   - Type: **Supabase Edge Function**
   - Function: `notify-admin`
3. Create **second webhook**:
   - Name: `notify-on-new-appointment`
   - Table: `appointments`
   - Events: `INSERT`
   - Type: **Supabase Edge Function**
   - Function: `notify-admin`

Now whenever a new inquiry or appointment is created, an email notification will be sent to the configured admin email address.

---

## Connecting vividautodetails.com

To receive inquiries from the Vivid Auto Details website, the contact form on `vividautodetails.com` needs to submit data to your Supabase database. Here's what you need to add to the contact form:

### Option A: Direct Supabase Insert (Recommended for simple forms)

Add this JavaScript to the vividautodetails.com contact form page:

```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script>
  const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
  // Replace SITE_ID with the UUID of the Vivid Auto Details site from your client_sites table
  const SITE_ID = 'YOUR_VIVID_SITE_ID';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);

    const { error } = await supabase.from('inquiries').insert({
      site_id: SITE_ID,
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
      service_requested: formData.get('service'),
      vehicle_info: formData.get('vehicle'),
      preferred_date: formData.get('preferred_date') || null,
      status: 'new',
      source: 'website',
    });

    if (error) {
      alert('Something went wrong. Please call us directly.');
      console.error(error);
    } else {
      alert('Thank you! We will get back to you shortly.');
      this.reset();
    }
  });
</script>
```

### Option B: API Endpoint (if you prefer server-side)

Create a small API route on the vividautodetails server that accepts form data and inserts it to Supabase using the **service_role** key (never expose service_role on the client side).

---

## How to Find Your Site ID

After seeding, run this in the SQL Editor:
```sql
SELECT id, site_name FROM public.client_sites;
```

Copy the `id` UUID for Vivid Auto Details â€” you'll need it for the contact form integration.

---

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

- **Landing page**: http://localhost:5173/landing (or landing.html)
- **Home**: http://localhost:5173/
- **Login**: http://localhost:5173/login
- **Preview Builder**: http://localhost:5173/preview (read-only, non-logged-in only)
- **Dashboard Hub**: http://localhost:5173/dashboard (requires login â€” main hub)
- **QR Builder**: http://localhost:5173/qr-builder (requires login)
- **QR Dashboard**: http://localhost:5173/qr-dashboard (requires login)
- **Admin Portal**: http://localhost:5173/admin (requires login)
- **My Sites Editor**: http://localhost:5173/site-editor (requires login)

---

## Project Structure

```
/
â”œâ”€â”€ landing.html          â† Landing page (first page visitors see)
â”œâ”€â”€ index.html            â† React SPA entry point
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ App.jsx           â† Router + nav
â”‚   â”œâ”€â”€ main.jsx          â† React root
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ supabaseClient.js     â† Supabase connection
â”‚   â”‚   â””â”€â”€ adminApi.js           â† All admin API functions
â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ AdminDashboardPage.jsx   â† Main admin portal
â”‚   â”‚   â”œâ”€â”€ DashboardPage.jsx        â† QR/Card builder
â”‚   â”‚   â”œâ”€â”€ HomePage.jsx
â”‚   â”‚   â”œâ”€â”€ LoginPage.jsx
â”‚   â”‚   â””â”€â”€ ...
â”‚   â”œâ”€â”€ components/admin/
â”‚   â”‚   â”œâ”€â”€ OverviewTab.jsx       â† Dashboard overview with stats
â”‚   â”‚   â”œâ”€â”€ InquiriesTab.jsx      â† Inquiry/lead management
â”‚   â”‚   â”œâ”€â”€ CalendarTab.jsx       â† Appointment calendar
â”‚   â”‚   â”œâ”€â”€ CustomersTab.jsx      â† Full CRM
â”‚   â”‚   â”œâ”€â”€ ServicesTab.jsx       â† Service management
â”‚   â”‚   â””â”€â”€ AnalyticsTab.jsx      â† Business analytics
â”‚   â””â”€â”€ styles/app.css
â”œâ”€â”€ supabase/functions/
â”‚   â””â”€â”€ notify-admin/index.ts    â† Edge function for email notifications
â”œâ”€â”€ vercel.json
â”œâ”€â”€ vite.config.js
â””â”€â”€ package.json
```

---

## Summary of What Each Admin Tab Does

| Tab | Purpose |
|-----|---------|
| **Overview** | Quick stats (customers, inquiries, upcoming appointments), recent activity feed |
| **Inquiries** | All incoming leads from website contact forms. Filter by status (new, contacted, booked, completed, cancelled). Add notes, update status. |
| **Calendar** | Month view calendar showing all appointments. Click a day to see details. Create, edit, delete appointments. Link to customers and services. |
| **Customers** | Full CRM â€” add/edit/delete customers. Vehicle info (make, model, year, color, plate). Tags, source tracking. Notes. Appointment history per customer. |
| **Services** | Manage business services (name, description, price, duration). Toggle active/inactive. |
| **Payments** | Track deposits, payment links, balances, and paid status per customer or appointment. |
| **Analytics** | Charts: inquiries by month, appointments by month, busiest days, conversion rate, customer sources. |

---

## Booking Portal Route

After deploying the updated frontend, each published site gets a hosted booking portal at:

```text
https://your-domain.com/book/<site-slug>
```

For Vivid, the route becomes:

```text
https://cielonline.com/book/vivid-auto-details
```

### Updated Vivid Bridge Snippet

The Vivid handoff copy in this workspace now uses the reusable bridge include below. It resolves the site by slug, so you do not need to hardcode a UUID into the website:

```html
<script
  src="https://cielonline.com/bridge.js"
  data-supabase-url="https://rmuqwdfbjisugvbotdox.supabase.co"
  data-supabase-key="YOUR_PUBLIC_ANON_KEY"
  data-site-slug="vivid-auto-details"
></script>
```
