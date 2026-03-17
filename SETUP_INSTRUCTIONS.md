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

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend / DB | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel |
| Email | Resend (via Supabase Edge Functions) |
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
- **Admin Portal**: http://localhost:5173/admin (requires login)
- **QR Dashboard**: http://localhost:5173/dashboard (requires login)

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
| **Analytics** | Charts: inquiries by month, appointments by month, busiest days, conversion rate, customer sources. |
