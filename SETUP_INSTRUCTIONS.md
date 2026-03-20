# Cielonline — Complete Setup Instructions

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
| Payments | Stripe Connect Standard |
| Domain | cielonline.com |

---

## Step-by-Step Setup

Before running SQL, also review `SUPABASE_AI_AGENT_PROMPT.md`. That prompt is designed for Supabase AI to audit the current project and add any missing schema, enum, index, trigger, or RLS pieces required by Cielonline.

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
1. Go to **Project Settings → API**
2. Copy these two values:
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **Project API key → anon public** (starts with `eyJ...`)

### 3. Create `.env` File

Create a file named `.env` in the project root (same level as `package.json`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

You can also start from `.env.example` in the repo.

### 4. Run the Database SQL

Go to **SQL Editor → New query** in your Supabase dashboard and run the following SQL.
Copy and paste the ENTIRE block below and run it all at once:

```sql
-- ════════════════════════════════════════════════════════════════
-- CIELONLINE COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor (one-time setup)
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Enum types ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'qr_target_type' AND n.nspname = 'public') THEN
    CREATE TYPE public.qr_target_type AS ENUM ('card', 'url', 'wifi');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'inquiry_status' AND n.nspname = 'public') THEN
    CREATE TYPE public.inquiry_status AS ENUM ('new', 'contacted', 'booked', 'completed', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'appointment_status' AND n.nspname = 'public') THEN
    CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
  END IF;
END $$;

-- ── Updated timestamp trigger ──
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════════
-- EXISTING TABLES (cards, qr_codes, scan_events)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,60}$'),
  full_name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  bio TEXT,
  website TEXT,
  avatar_url TEXT,
  template_key TEXT NOT NULL DEFAULT 'template-a' CHECK (template_key IN (
    'template-a','template-b','template-c','template-d','template-e'
  )),
  background_color TEXT NOT NULL DEFAULT '#355dff',
  phone_1 TEXT,
  phone_2 TEXT,
  email_1 TEXT,
  email_2 TEXT,
  address TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  social JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,80}$'),
  type public.qr_target_type NOT NULL,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  target_url TEXT,
  wifi_ssid TEXT,
  wifi_password TEXT,
  wifi_encryption TEXT CHECK (wifi_encryption IN ('WPA','WEP','nopass')),
  wifi_hidden BOOLEAN NOT NULL DEFAULT false,
  qr_payload TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT qr_codes_payload_valid CHECK (
    (type = 'card' AND card_id IS NOT NULL AND target_url IS NULL AND wifi_ssid IS NULL)
    OR (type = 'url' AND target_url IS NOT NULL AND card_id IS NULL AND wifi_ssid IS NULL)
    OR (type = 'wifi' AND wifi_ssid IS NOT NULL AND card_id IS NULL AND target_url IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.scan_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  qr_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT,
  source_ip TEXT
);

-- ════════════════════════════════════════════════════════════════
-- CLIENT SITES (websites managed by Cielonline)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.client_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_url TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  business_type TEXT DEFAULT 'service',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- SITE BLOCKS (for the website editor — existing feature)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.site_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- SERVICES (what the business offers)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  duration_minutes INT DEFAULT 60,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- CUSTOMERS (CRM — end customers of the business)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  -- Vehicle fields (for auto detailing businesses)
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INT,
  vehicle_color TEXT,
  license_plate TEXT,
  -- CRM fields
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- CUSTOMER NOTES
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- INQUIRIES (from website contact forms)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  service_requested TEXT,
  vehicle_info TEXT,
  preferred_date TIMESTAMPTZ,
  status public.inquiry_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- APPOINTMENTS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  service_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- TRIGGERS (auto-update updated_at)
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS cards_set_updated_at ON public.cards;
CREATE TRIGGER cards_set_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS qrcodes_set_updated_at ON public.qr_codes;
CREATE TRIGGER qrcodes_set_updated_at BEFORE UPDATE ON public.qr_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS client_sites_set_updated_at ON public.client_sites;
CREATE TRIGGER client_sites_set_updated_at BEFORE UPDATE ON public.client_sites FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS customers_set_updated_at ON public.customers;
CREATE TRIGGER customers_set_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS inquiries_set_updated_at ON public.inquiries;
CREATE TRIGGER inquiries_set_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS appointments_set_updated_at ON public.appointments;
CREATE TRIGGER appointments_set_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Cards
DROP POLICY IF EXISTS cards_owner_all ON public.cards;
CREATE POLICY cards_owner_all ON public.cards FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS cards_public_read_published ON public.cards;
CREATE POLICY cards_public_read_published ON public.cards FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- QR codes
DROP POLICY IF EXISTS qrcodes_owner_all ON public.qr_codes;
CREATE POLICY qrcodes_owner_all ON public.qr_codes FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Scan events (server-side only)
DROP POLICY IF EXISTS scan_events_block_client ON public.scan_events;
CREATE POLICY scan_events_block_client ON public.scan_events FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- Client sites: owner can do everything
DROP POLICY IF EXISTS client_sites_owner_all ON public.client_sites;
CREATE POLICY client_sites_owner_all ON public.client_sites FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Site blocks: owner of the site can manage blocks
DROP POLICY IF EXISTS site_blocks_owner ON public.site_blocks;
CREATE POLICY site_blocks_owner ON public.site_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

-- Public read for site blocks (for /s/slug pages)
DROP POLICY IF EXISTS site_blocks_public_read ON public.site_blocks;
CREATE POLICY site_blocks_public_read ON public.site_blocks FOR SELECT TO anon, authenticated
  USING (true);

-- Services: site owner manages, public can read active services
DROP POLICY IF EXISTS services_owner ON public.services;
CREATE POLICY services_owner ON public.services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS services_public_read ON public.services;
CREATE POLICY services_public_read ON public.services FOR SELECT TO anon
  USING (is_active = true);

-- Customers: site owner manages
DROP POLICY IF EXISTS customers_owner ON public.customers;
CREATE POLICY customers_owner ON public.customers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

-- Customer notes: accessible if owner of customer's site
DROP POLICY IF EXISTS customer_notes_owner ON public.customer_notes;
CREATE POLICY customer_notes_owner ON public.customer_notes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.customers c
    JOIN public.client_sites s ON s.id = c.site_id
    WHERE c.id = customer_id AND s.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.customers c
    JOIN public.client_sites s ON s.id = c.site_id
    WHERE c.id = customer_id AND s.owner_id = auth.uid()
  ));

-- Inquiries: site owner manages; anon can INSERT (for contact forms)
DROP POLICY IF EXISTS inquiries_owner ON public.inquiries;
CREATE POLICY inquiries_owner ON public.inquiries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS inquiries_anon_insert ON public.inquiries;
CREATE POLICY inquiries_anon_insert ON public.inquiries FOR INSERT TO anon
  WITH CHECK (true);

-- Appointments: site owner manages
DROP POLICY IF EXISTS appointments_owner ON public.appointments;
CREATE POLICY appointments_owner ON public.appointments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

-- ════════════════════════════════════════════════════════════════
-- INDEXES (for performance)
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_customers_site ON public.customers(site_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_site ON public.inquiries(site_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_appointments_site ON public.appointments(site_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_services_site ON public.services(site_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON public.customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_site_blocks_site ON public.site_blocks(site_id);
```

### 5. Configure Stripe Connect For Client-Owned Payments

This is the recommended production payment architecture for client businesses like Vivid.

Use Stripe Connect Standard.

Why this is the right model:
1. Your client owns their Stripe account.
2. Their payouts go to their bank account directly.
3. Their taxes, disputes, and compliance stay attached to their own business account.
4. Cielonline acts as the platform CRM and payment-link generator, not the merchant of record.

Create one platform Stripe account for Cielonline, then let each client connect their own Stripe account through onboarding.

Required Supabase Edge Function secrets:

1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `STRIPE_SECRET_KEY`
5. `STRIPE_WEBHOOK_SECRET`
6. `RESEND_API_KEY` if using email notifications
7. `ADMIN_NOTIFICATION_EMAIL` if using email notifications

Deploy these edge functions:

1. `notify-admin`
2. `create-stripe-account-link`
3. `create-stripe-checkout-link`
4. `create-public-booking-checkout`
5. `stripe-webhook`

Example commands:

```bash
supabase functions deploy notify-admin
supabase functions deploy create-stripe-account-link
supabase functions deploy create-stripe-checkout-link
supabase functions deploy create-public-booking-checkout
supabase functions deploy stripe-webhook
```

In Stripe dashboard, add a webhook endpoint pointing to your deployed Supabase function:

```text
https://YOUR_PROJECT_ID.functions.supabase.co/stripe-webhook
```

Subscribe it to at least:

1. `checkout.session.completed`
2. `payment_intent.payment_failed`
3. `account.updated`

Automatic behavior after this is deployed:

1. When you click `Connect Stripe`, Cielonline creates or reuses the client's connected account and stores the Stripe account ID in Supabase automatically.
2. When the client finishes onboarding in Stripe, Stripe sends `account.updated` events.
3. The webhook updates the client's `client_sites.settings` record automatically.
4. You do not manually paste the Stripe account ID into Supabase.

After deployment:
1. open the Payments tab for a client site
2. click `Connect Stripe`
3. complete onboarding as that client business
4. create a payment record
5. click `Generate Checkout`
6. send the checkout URL to the customer or let the booking flow use it for deposits

### 6. Vercel Move For Vivid

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

### 5. Seed the First Client Site (Vivid Auto Details)

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

### 6. Configure Auth

In Supabase dashboard:
1. Go to **Authentication → Providers**
2. Open **Email** provider
3. Enable:
   - Email/Password ✅
   - Magic Link ✅ (optional)
4. Save

For easier testing, you can temporarily disable **"Confirm email"** in Auth settings.

### 7. Set Auth URLs

Go to **Authentication → URL Configuration**:

**Site URL**: `http://localhost:5173`

**Additional Redirect URLs** (add each one):
- `http://localhost:5173/dashboard`
- `http://localhost:5173/admin`
- `https://YOUR-VERCEL-DOMAIN.vercel.app/dashboard`
- `https://YOUR-VERCEL-DOMAIN.vercel.app/admin`
- `https://cielonline.com/dashboard`
- `https://cielonline.com/admin`

### 8. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
4. Deploy

### 9. Set Up Email Notifications (Resend + Supabase Edge Functions)

This allows the admin to receive emails when new inquiries or appointments come in.

#### 9a. Set up Resend

1. Go to [https://resend.com](https://resend.com) and create a free account
2. Add and verify your domain (`cielonline.com`) — or use a free `onboarding@resend.dev` for testing
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
1. Go to **Database → Webhooks** (or **Integrations → Webhooks**)
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

Copy the `id` UUID for Vivid Auto Details — you'll need it for the contact form integration.

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
- **Dashboard Hub**: http://localhost:5173/dashboard (requires login — main hub)
- **QR Builder**: http://localhost:5173/qr-builder (requires login)
- **QR Dashboard**: http://localhost:5173/qr-dashboard (requires login)
- **Admin Portal**: http://localhost:5173/admin (requires login)
- **My Sites Editor**: http://localhost:5173/site-editor (requires login)

---

## Project Structure

```
/
├── landing.html          ← Landing page (first page visitors see)
├── index.html            ← React SPA entry point
├── src/
│   ├── App.jsx           ← Router + nav
│   ├── main.jsx          ← React root
│   ├── lib/
│   │   ├── supabaseClient.js     ← Supabase connection
│   │   └── adminApi.js           ← All admin API functions
│   ├── pages/
│   │   ├── AdminDashboardPage.jsx   ← Main admin portal
│   │   ├── DashboardPage.jsx        ← QR/Card builder
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   └── ...
│   ├── components/admin/
│   │   ├── OverviewTab.jsx       ← Dashboard overview with stats
│   │   ├── InquiriesTab.jsx      ← Inquiry/lead management
│   │   ├── CalendarTab.jsx       ← Appointment calendar
│   │   ├── CustomersTab.jsx      ← Full CRM
│   │   ├── ServicesTab.jsx       ← Service management
│   │   └── AnalyticsTab.jsx      ← Business analytics
│   └── styles/app.css
├── supabase/functions/
│   └── notify-admin/index.ts    ← Edge function for email notifications
├── vercel.json
├── vite.config.js
└── package.json
```

---

## Summary of What Each Admin Tab Does

| Tab | Purpose |
|-----|---------|
| **Overview** | Quick stats (customers, inquiries, upcoming appointments), recent activity feed |
| **Inquiries** | All incoming leads from website contact forms. Filter by status (new, contacted, booked, completed, cancelled). Add notes, update status. |
| **Calendar** | Month view calendar showing all appointments. Click a day to see details. Create, edit, delete appointments. Link to customers and services. |
| **Customers** | Full CRM — add/edit/delete customers. Vehicle info (make, model, year, color, plate). Tags, source tracking. Notes. Appointment history per customer. |
| **Services** | Manage business services (name, description, price, duration). Toggle active/inactive. |
| **Payments** | Track deposits, payment links, balances, and paid status per customer or appointment. |
| **Analytics** | Charts: inquiries by month, appointments by month, busiest days, conversion rate, customer sources. |

---

## External Site Control Add-On SQL

Run this SQL after the base schema if you want the newer external-site management features used by the Vivid integration in this repo.

This adds:
- managed website content fields per site
- tracked website events for analytics
- payment records for deposits / invoices
- public booking support improvements
- service settings for deposits and online booking

```sql
alter table public.client_sites
  add column if not exists booking_page_enabled boolean not null default true;

alter table public.services
  add column if not exists deposit_amount numeric(10,2),
  add column if not exists booking_enabled boolean not null default true;

create table if not exists public.site_content_entries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.client_sites(id) on delete cascade,
  content_key text not null,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'textarea', 'url', 'json')),
  section_name text not null default 'General',
  page_path text not null default '/',
  value_text text,
  value_json jsonb,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_content_entries_unique unique (site_id, content_key)
);

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  site_id uuid not null references public.client_sites(id) on delete cascade,
  page_path text,
  event_type text not null default 'engagement',
  event_name text not null,
  visitor_id text,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.client_sites(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  label text not null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending', 'payment_link_sent', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method text,
  external_reference text,
  checkout_url text,
  due_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_content_entries_set_updated_at on public.site_content_entries;
create trigger site_content_entries_set_updated_at
before update on public.site_content_entries
for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.site_content_entries enable row level security;
alter table public.site_events enable row level security;
alter table public.payments enable row level security;

drop policy if exists client_sites_public_read on public.client_sites;
create policy client_sites_public_read on public.client_sites
for select to anon, authenticated
using (is_published = true);

drop policy if exists site_content_entries_owner on public.site_content_entries;
create policy site_content_entries_owner on public.site_content_entries
for all to authenticated
using (
  exists (
    select 1 from public.client_sites s
    where s.id = site_content_entries.site_id and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.client_sites s
    where s.id = site_content_entries.site_id and s.owner_id = auth.uid()
  )
);

drop policy if exists site_content_entries_public_read on public.site_content_entries;
create policy site_content_entries_public_read on public.site_content_entries
for select to anon, authenticated
using (is_public = true);

drop policy if exists site_events_owner on public.site_events;
create policy site_events_owner on public.site_events
for select to authenticated
using (
  exists (
    select 1 from public.client_sites s
    where s.id = site_events.site_id and s.owner_id = auth.uid()
  )
);

drop policy if exists site_events_public_insert on public.site_events;
create policy site_events_public_insert on public.site_events
for insert to anon, authenticated
with check (site_id is not null);

drop policy if exists payments_owner on public.payments;
create policy payments_owner on public.payments
for all to authenticated
using (
  exists (
    select 1 from public.client_sites s
    where s.id = payments.site_id and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.client_sites s
    where s.id = payments.site_id and s.owner_id = auth.uid()
  )
);

drop policy if exists customers_public_insert on public.customers;
create policy customers_public_insert on public.customers
for insert to anon, authenticated
with check (site_id is not null);

drop policy if exists appointments_public_insert on public.appointments;
create policy appointments_public_insert on public.appointments
for insert to anon, authenticated
with check (site_id is not null);

drop policy if exists payments_public_insert on public.payments;
create policy payments_public_insert on public.payments
for insert to anon, authenticated
with check (site_id is not null and status in ('pending', 'payment_link_sent'));

create index if not exists idx_site_content_entries_site on public.site_content_entries(site_id);
create index if not exists idx_site_content_entries_key on public.site_content_entries(site_id, content_key);
create index if not exists idx_site_events_site on public.site_events(site_id, created_at desc);
create index if not exists idx_site_events_name on public.site_events(site_id, event_name);
create index if not exists idx_payments_site on public.payments(site_id, created_at desc);
create index if not exists idx_payments_status on public.payments(site_id, status);
```

### Booking Portal Route

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
