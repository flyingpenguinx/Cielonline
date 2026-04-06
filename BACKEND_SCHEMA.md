# Cielonline — Complete Backend Schema

> **Purpose**: This is the single source of truth for the entire Supabase backend.
> If you ever need to rebuild the database from scratch (new Supabase project, migration, disaster recovery), run the SQL in this file in order.
>
> **Last updated**: April 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Complete SQL Schema](#complete-sql-schema)
3. [Storage Buckets](#storage-buckets)
4. [Realtime Configuration](#realtime-configuration)
5. [Edge Functions](#edge-functions)
6. [Required Supabase Secrets](#required-supabase-secrets)
7. [Post-Setup Verification](#post-setup-verification)

---

## Architecture Overview

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend / DB | Supabase (Postgres + Auth + RLS + Realtime + Storage) |
| Hosting | Vercel |
| Email | Resend (via Supabase Edge Functions) |
| Payments | Square (primary), Stripe (alternative) |
| Domain | cielonline.com |

### Tables

| Table | Purpose |
|-------|---------|
| `cards` | Digital business cards |
| `qr_codes` | QR code records (card, url, wifi) |
| `scan_events` | QR scan analytics |
| `client_sites` | Websites managed by Cielonline |
| `site_blocks` | Block-based page editor content |
| `services` | Business service catalog |
| `customers` | CRM customer records |
| `customer_notes` | Notes attached to customers |
| `inquiries` | Leads from website contact forms |
| `appointments` | Scheduled appointments |
| `site_content_entries` | Editable content fields on external sites |
| `site_events` | Website analytics events |
| `payments` | Payment records, invoices, deposits |
| `completed_jobs` | Job history, visit tracking, reporting |

---

## Complete SQL Schema

Run this entire block in the Supabase SQL Editor. It is idempotent — safe to re-run on an existing project.

```sql
-- ════════════════════════════════════════════════════════════════
-- CIELONLINE — COMPLETE DATABASE SCHEMA (DISASTER RECOVERY)
-- Safe to run on a fresh or existing Supabase project.
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ══════════════════════════════════════════
-- ENUM TYPES
-- ══════════════════════════════════════════

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
    CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'requested');
  END IF;
END $$;

-- Add 'requested' to appointment_status if it exists but is missing the value
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'appointment_status' AND e.enumlabel = 'requested') THEN
    ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'requested';
  END IF;
END $$;


-- ══════════════════════════════════════════
-- TRIGGER FUNCTION
-- ══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ══════════════════════════════════════════
-- TABLE: cards
-- ══════════════════════════════════════════

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


-- ══════════════════════════════════════════
-- TABLE: qr_codes
-- ══════════════════════════════════════════

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


-- ══════════════════════════════════════════
-- TABLE: scan_events
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.scan_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  qr_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT,
  source_ip TEXT
);


-- ══════════════════════════════════════════
-- TABLE: client_sites
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.client_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_url TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  favicon_url TEXT,
  business_type TEXT DEFAULT 'service',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  subscription_status TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'free')),
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ DEFAULT NULL,
  is_subscription_required BOOLEAN NOT NULL DEFAULT false,
  booking_page_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- settings jsonb can store payment-provider metadata:
--   payment_provider, stripe_account_id, stripe_charges_enabled, stripe_details_submitted
--   square_merchant_id, square_access_token, square_refresh_token, square_location_id


-- ══════════════════════════════════════════
-- TABLE: site_blocks
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.site_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ══════════════════════════════════════════
-- TABLE: services
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  duration_minutes INT DEFAULT 60,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  booking_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ══════════════════════════════════════════
-- TABLE: customers
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INT,
  vehicle_color TEXT,
  license_plate TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ══════════════════════════════════════════
-- TABLE: customer_notes
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ══════════════════════════════════════════
-- TABLE: inquiries
-- ══════════════════════════════════════════

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


-- ══════════════════════════════════════════
-- TABLE: appointments
-- ══════════════════════════════════════════

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


-- ══════════════════════════════════════════
-- TABLE: site_content_entries
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.site_content_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  content_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text', 'textarea', 'url', 'json', 'image')),
  section_name TEXT NOT NULL DEFAULT 'General',
  page_path TEXT NOT NULL DEFAULT '/',
  value_text TEXT,
  value_json JSONB,
  is_public BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_content_entries_unique UNIQUE (site_id, content_key)
);


-- ══════════════════════════════════════════
-- TABLE: site_events
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.site_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  page_path TEXT,
  event_type TEXT NOT NULL DEFAULT 'engagement',
  event_name TEXT NOT NULL,
  visitor_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ══════════════════════════════════════════
-- TABLE: payments
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'payment_link_sent', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT,
  external_reference TEXT,
  checkout_url TEXT,
  external_payment_id TEXT,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ══════════════════════════════════════════
-- TABLE: completed_jobs
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.completed_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  services_performed TEXT[] DEFAULT '{}'::text[],
  title TEXT NOT NULL,
  notes TEXT,
  images TEXT[] DEFAULT '{}'::text[],
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount_charged NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ══════════════════════════════════════════
-- TRIGGERS (auto-update updated_at)
-- ══════════════════════════════════════════

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

DROP TRIGGER IF EXISTS site_content_entries_set_updated_at ON public.site_content_entries;
CREATE TRIGGER site_content_entries_set_updated_at BEFORE UPDATE ON public.site_content_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS site_blocks_set_updated_at ON public.site_blocks;
CREATE TRIGGER site_blocks_set_updated_at BEFORE UPDATE ON public.site_blocks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_completed_jobs_updated_at ON public.completed_jobs;
CREATE TRIGGER set_completed_jobs_updated_at BEFORE UPDATE ON public.completed_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════

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
ALTER TABLE public.site_content_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_jobs ENABLE ROW LEVEL SECURITY;

-- Cards: owner manages, public reads published
DROP POLICY IF EXISTS cards_owner_all ON public.cards;
CREATE POLICY cards_owner_all ON public.cards FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS cards_public_read_published ON public.cards;
CREATE POLICY cards_public_read_published ON public.cards FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- QR codes: owner manages
DROP POLICY IF EXISTS qrcodes_owner_all ON public.qr_codes;
CREATE POLICY qrcodes_owner_all ON public.qr_codes FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Scan events: server-side only
DROP POLICY IF EXISTS scan_events_block_client ON public.scan_events;
CREATE POLICY scan_events_block_client ON public.scan_events FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- Client sites: owner manages, public reads published
DROP POLICY IF EXISTS client_sites_owner_all ON public.client_sites;
CREATE POLICY client_sites_owner_all ON public.client_sites FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS client_sites_public_read ON public.client_sites;
CREATE POLICY client_sites_public_read ON public.client_sites FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Site blocks: owner manages, public reads
DROP POLICY IF EXISTS site_blocks_owner ON public.site_blocks;
CREATE POLICY site_blocks_owner ON public.site_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS site_blocks_public_read ON public.site_blocks;
CREATE POLICY site_blocks_public_read ON public.site_blocks FOR SELECT TO anon, authenticated
  USING (true);

-- Services: owner manages, public reads active
DROP POLICY IF EXISTS services_owner ON public.services;
CREATE POLICY services_owner ON public.services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS services_public_read ON public.services;
CREATE POLICY services_public_read ON public.services FOR SELECT TO anon
  USING (is_active = true);

-- Customers: owner manages, public can insert (for booking forms)
DROP POLICY IF EXISTS customers_owner ON public.customers;
CREATE POLICY customers_owner ON public.customers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS customers_public_insert ON public.customers;
CREATE POLICY customers_public_insert ON public.customers FOR INSERT TO anon, authenticated
  WITH CHECK (site_id IS NOT NULL);

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

-- Inquiries: owner manages, anon can insert (contact forms)
DROP POLICY IF EXISTS inquiries_owner ON public.inquiries;
CREATE POLICY inquiries_owner ON public.inquiries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS inquiries_anon_insert ON public.inquiries;
CREATE POLICY inquiries_anon_insert ON public.inquiries FOR INSERT TO anon
  WITH CHECK (true);

-- Appointments: owner manages, public can insert (booking forms)
DROP POLICY IF EXISTS appointments_owner ON public.appointments;
CREATE POLICY appointments_owner ON public.appointments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites WHERE id = site_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS appointments_public_insert ON public.appointments;
CREATE POLICY appointments_public_insert ON public.appointments FOR INSERT TO anon, authenticated
  WITH CHECK (site_id IS NOT NULL);

-- Site content entries: owner manages, public reads public entries
DROP POLICY IF EXISTS site_content_entries_owner ON public.site_content_entries;
CREATE POLICY site_content_entries_owner ON public.site_content_entries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites s WHERE s.id = site_content_entries.site_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites s WHERE s.id = site_content_entries.site_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS site_content_entries_public_read ON public.site_content_entries;
CREATE POLICY site_content_entries_public_read ON public.site_content_entries FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- Site events: owner reads, public can insert
DROP POLICY IF EXISTS site_events_owner ON public.site_events;
CREATE POLICY site_events_owner ON public.site_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites s WHERE s.id = site_events.site_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS site_events_public_insert ON public.site_events;
CREATE POLICY site_events_public_insert ON public.site_events FOR INSERT TO anon, authenticated
  WITH CHECK (site_id IS NOT NULL);

-- Payments: owner manages, public can insert pending payments
DROP POLICY IF EXISTS payments_owner ON public.payments;
CREATE POLICY payments_owner ON public.payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_sites s WHERE s.id = payments.site_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_sites s WHERE s.id = payments.site_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS payments_public_insert ON public.payments;
CREATE POLICY payments_public_insert ON public.payments FOR INSERT TO anon, authenticated
  WITH CHECK (site_id IS NOT NULL AND status IN ('pending', 'payment_link_sent'));

-- Completed jobs: owner manages
DROP POLICY IF EXISTS completed_jobs_owner_all ON public.completed_jobs;
CREATE POLICY completed_jobs_owner_all ON public.completed_jobs FOR ALL TO authenticated
  USING (site_id IN (SELECT id FROM public.client_sites WHERE owner_id = auth.uid()))
  WITH CHECK (site_id IN (SELECT id FROM public.client_sites WHERE owner_id = auth.uid()));


-- ══════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════

-- Cards & QR
CREATE INDEX IF NOT EXISTS idx_cards_owner ON public.cards(owner_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_owner ON public.qr_codes(owner_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_qr ON public.scan_events(qr_id, scanned_at DESC);

-- Client sites
CREATE INDEX IF NOT EXISTS idx_client_sites_owner ON public.client_sites(owner_id);
CREATE INDEX IF NOT EXISTS idx_client_sites_slug ON public.client_sites(slug);
CREATE INDEX IF NOT EXISTS idx_client_sites_subscription ON public.client_sites(subscription_status, is_subscription_required);

-- Site blocks
CREATE INDEX IF NOT EXISTS idx_site_blocks_site ON public.site_blocks(site_id);
CREATE INDEX IF NOT EXISTS idx_site_blocks_sort ON public.site_blocks(site_id, sort_order);

-- Services
CREATE INDEX IF NOT EXISTS idx_services_site ON public.services(site_id);
CREATE INDEX IF NOT EXISTS idx_services_sort ON public.services(site_id, sort_order);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_site ON public.customers(site_id);

-- Customer notes
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON public.customer_notes(customer_id);

-- Inquiries
CREATE INDEX IF NOT EXISTS idx_inquiries_site ON public.inquiries(site_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries(site_id, created_at DESC);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_site ON public.appointments(site_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_site_scheduled ON public.appointments(site_id, scheduled_at);

-- Site content entries
CREATE INDEX IF NOT EXISTS idx_site_content_entries_site ON public.site_content_entries(site_id);
CREATE INDEX IF NOT EXISTS idx_site_content_entries_key ON public.site_content_entries(site_id, content_key);
CREATE INDEX IF NOT EXISTS idx_site_content_entries_site_public ON public.site_content_entries(site_id, is_public);
CREATE INDEX IF NOT EXISTS idx_site_content_entries_page ON public.site_content_entries(site_id, page_path, sort_order);

-- Site events
CREATE INDEX IF NOT EXISTS idx_site_events_site ON public.site_events(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_name ON public.site_events(site_id, event_name);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_site ON public.payments(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(site_id, status);

-- Completed jobs
CREATE INDEX IF NOT EXISTS idx_completed_jobs_site_id ON public.completed_jobs(site_id);
CREATE INDEX IF NOT EXISTS idx_completed_jobs_customer_id ON public.completed_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_completed_jobs_completed_at ON public.completed_jobs(site_id, completed_at DESC);
```

---

## Storage Buckets

Run this after the schema SQL:

```sql
-- Public bucket for site content images, gallery images, job photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images',
  'site-images',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'site_images_public_read') THEN
    CREATE POLICY site_images_public_read ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'site-images');
  END IF;
END $$;

-- Storage RLS: authenticated upload
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'site_images_auth_insert') THEN
    CREATE POLICY site_images_auth_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-images');
  END IF;
END $$;

-- Storage RLS: authenticated update
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'site_images_auth_update') THEN
    CREATE POLICY site_images_auth_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-images');
  END IF;
END $$;

-- Storage RLS: authenticated delete
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'site_images_auth_delete') THEN
    CREATE POLICY site_images_auth_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-images');
  END IF;
END $$;
```

### Storage folder conventions

| Path pattern | Purpose |
|-------------|---------|
| `{site_id}/content/{content_key}` | Site content images (hero, about, gallery) |
| `{site_id}/jobs/{job_id}/` | Completed job photos |

---

## Realtime Configuration

```sql
-- Enable Realtime on site_content_entries so bridge.js can live-update external sites
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content_entries;
```

---

## Edge Functions

These are deployed via `supabase functions deploy <name>`. Source code is in `supabase/functions/`.

| Function | Purpose | Trigger |
|----------|---------|---------|
| `notify-admin` | Sends email notification to admin | Database webhook on `inquiries` INSERT and `appointments` INSERT |
| `create-square-oauth-link` | Generates Square OAuth URL for client connection | Called from Payments tab |
| `square-oauth-callback` | Handles Square OAuth redirect, saves credentials | Square redirect |
| `create-square-checkout-link` | Creates a Square checkout payment link | Called from Payments tab |
| `square-webhook` | Processes Square payment events | Square webhook |
| `create-stripe-account-link` | Generates Stripe Connect onboarding URL | Called from Payments tab |
| `create-stripe-checkout-link` | Creates a Stripe checkout payment link | Called from Payments tab |
| `stripe-webhook` | Processes Stripe payment events | Stripe webhook |
| `create-public-booking-checkout` | Creates checkout for public booking portal | Public booking page |

### Database Webhooks (configure in Supabase Dashboard)

| Webhook name | Table | Event | Edge Function |
|-------------|-------|-------|---------------|
| `notify-on-new-inquiry` | `inquiries` | INSERT | `notify-admin` |
| `notify-on-new-appointment` | `appointments` | INSERT | `notify-admin` |

---

## Required Supabase Secrets

Set via `supabase secrets set KEY=VALUE`:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (edge functions only) |
| `RESEND_API_KEY` | Email notifications via Resend |
| `ADMIN_NOTIFICATION_EMAIL` | Where admin notification emails go |
| `SQUARE_APPLICATION_ID` | Square app ID |
| `SQUARE_APPLICATION_SECRET` | Square app secret |
| `SQUARE_ENVIRONMENT` | `sandbox` or `production` |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Square webhook verification |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `FRONTEND_ORIGIN` | e.g. `https://cielonline.com` |

---

## Post-Setup Verification

Run these queries to confirm everything is in place:

```sql
-- All tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- RLS is enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN (
  'cards', 'qr_codes', 'scan_events', 'client_sites', 'site_blocks',
  'services', 'customers', 'customer_notes', 'inquiries', 'appointments',
  'site_content_entries', 'site_events', 'payments', 'completed_jobs'
)
ORDER BY tablename;

-- All policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- All triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Storage bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'site-images';

-- Realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```
