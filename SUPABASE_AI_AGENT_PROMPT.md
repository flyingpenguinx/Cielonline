Use this prompt inside Supabase AI for the Cielonline project.

```text
I am building a multi-tenant website administration platform called Cielonline. I need you to audit this Supabase project, compare it to the requirements below, and then generate and execute the SQL changes needed so the database is fully operational.

Your job:
1. Inspect the current schema, enum types, indexes, triggers, row level security policies, and public access paths.
2. Check whether each required table, column, constraint, trigger, and policy already exists.
3. Identify anything missing, inconsistent, duplicated, or unsafe.
4. Produce the exact SQL needed to bring the project to the required final state.
5. Make the SQL idempotent wherever possible so it can be re-run safely.
6. Explain what you changed and list any manual follow-up steps.

This system must support multiple client websites and multiple business types later, not just one detailing business.

Core product requirements:
- Multi-tenant client websites owned by authenticated users.
- CRM with customers, leads, notes, appointments, services, and payments.
- Public website integrations via a bridge script.
- Public website content slots editable from the admin dashboard without code changes.
- Public booking flow that can create customers, appointments, and optional payment records.
- Website analytics and event tracking.
- Block-based managed pages for Cielonline-hosted sites.
- Premade website templates should be supported as starter sets of site_blocks and editable block content. Do not assume a separate templates table is required unless the existing project already uses one safely.
- Client-owned payment processing via Stripe Connect Standard should be supported through client_sites.settings and edge functions, without making the platform the merchant of record.
- Safe public read access only where required for published public-facing experiences.

Required tables and capabilities:

1. auth-linked ownership tables
- client_sites
  - id uuid primary key default gen_random_uuid()
  - owner_id uuid references auth.users(id) on delete cascade not null
  - site_name text not null
  - site_url text
  - slug text unique
  - description text
  - business_type text default 'service'
  - settings jsonb default '{}'::jsonb not null
  - is_published boolean default true not null
  - created_at timestamptz default now() not null
  - updated_at timestamptz default now() not null

2. block editor support
- site_blocks
  - id uuid primary key default gen_random_uuid()
  - site_id uuid references client_sites(id) on delete cascade not null
  - block_type text not null
  - sort_order int default 0 not null
  - content jsonb default '{}'::jsonb not null
  - created_at timestamptz default now() not null
  - updated_at timestamptz default now() not null

3. services catalog
- services
  - id uuid primary key default gen_random_uuid()
  - site_id uuid references client_sites(id) on delete cascade not null
  - name text not null
  - description text
  - price numeric(10,2)
  - duration_minutes int default 60
  - sort_order int default 0
  - is_active boolean default true not null
  - deposit_amount numeric(10,2) default 0 not null
  - booking_enabled boolean default true not null
  - created_at timestamptz default now() not null
  - updated_at timestamptz default now() not null

4. CRM customers
- customers
  - id uuid primary key default gen_random_uuid()
  - site_id uuid references client_sites(id) on delete cascade not null
  - first_name text not null
  - last_name text not null
  - email text
  - phone text
  - address text
  - vehicle_make text
  - vehicle_model text
  - vehicle_year int
  - vehicle_color text
  - license_plate text
  - tags text[] default '{}'::text[]
  - source text default 'manual'
  - created_at timestamptz default now() not null
  - updated_at timestamptz default now() not null

5. customer notes
- customer_notes
  - id uuid primary key default gen_random_uuid()
  - customer_id uuid references customers(id) on delete cascade not null
  - content text not null
  - created_at timestamptz default now() not null

6. inquiries and leads
- inquiry_status enum should include at least:
  - new
  - contacted
  - booked
  - completed
  - cancelled
- inquiries
  - id uuid primary key default gen_random_uuid()
  - site_id uuid references client_sites(id) on delete cascade not null
  - name text
  - email text
  - phone text
  - message text
  - service_requested text
  - vehicle_info text
  - preferred_date timestamptz
  - status inquiry_status default 'new' not null
  - admin_notes text
  - source text default 'website'
  - created_at timestamptz default now() not null
  - updated_at timestamptz default now() not null

7. appointments
- appointment_status enum should include at least:
  - scheduled
  - confirmed
  - in_progress
  - completed
  - cancelled
  - no_show
  - requested
- appointments
  - id uuid primary key default gen_random_uuid()
  - site_id uuid references client_sites(id) on delete cascade not null
  - customer_id uuid references customers(id) on delete set null
  - title text not null
  - service_name text
  - scheduled_at timestamptz not null
  - duration_minutes int default 60
  - status appointment_status default 'scheduled' not null
  - notes text
  - created_at timestamptz default now() not null
  - updated_at timestamptz default now() not null

8. external website editable content
- site_content_entries
  - id uuid primary key default gen_random_uuid()
  - site_id uuid references client_sites(id) on delete cascade not null
  - content_key text not null
  - label text
  - field_type text default 'text' not null
  - section_name text
  - page_path text default '/' not null
  - sort_order int default 0 not null
  - value_text text
  - value_json jsonb
  - is_public boolean default true not null
  - created_at timestamptz default now() not null
  - updated_at timestamptz default now() not null
  - unique(site_id, content_key)

9. website analytics
- site_events
  - id uuid primary key default gen_random_uuid()
  - site_id uuid references client_sites(id) on delete cascade not null
  - page_path text
  - event_type text not null
  - event_name text not null
  - visitor_id text
  - metadata jsonb default '{}'::jsonb not null
  - referrer text
  - user_agent text
  - created_at timestamptz default now() not null

10. payments
- payments
  - id uuid primary key default gen_random_uuid()
  - site_id uuid references client_sites(id) on delete cascade not null
  - customer_id uuid references customers(id) on delete set null
  - appointment_id uuid references appointments(id) on delete set null
  - label text not null
  - amount numeric(10,2) not null
  - currency text default 'USD' not null
  - status text default 'pending' not null
  - payment_method text
  - checkout_url text
  - external_payment_id text
  - due_at timestamptz
  - paid_at timestamptz
  - notes text
  - created_at timestamptz default now() not null
  - updated_at timestamptz default now() not null

10b. payment settings in site metadata
- client_sites.settings should be able to store payment-provider metadata safely, for example:
  - payment_provider
  - stripe_account_id
  - stripe_charges_enabled
  - stripe_details_submitted
- Prefer using settings jsonb for these keys unless a stronger normalized schema already exists and is justified.

11. updated_at automation
- There should be a reusable public.set_updated_at() trigger function.
- All mutable tables with updated_at should have BEFORE UPDATE triggers wired to it.

12. performance and correctness expectations
- Add indexes for common filters and ordering, especially on:
  - client_sites.owner_id
  - client_sites.slug
  - site_blocks.site_id, sort_order
  - services.site_id, sort_order
  - customers.site_id
  - inquiries.site_id, created_at
  - appointments.site_id, scheduled_at
  - site_content_entries.site_id, page_path, sort_order
  - site_events.site_id, created_at
  - payments.site_id, created_at

13. row level security expectations
- RLS must be enabled on all app tables.
- Authenticated site owners should be able to fully manage only their own records.
- Public anonymous access should be limited to the minimum required for:
  - published public card and site pages
  - public site blocks for published managed pages if used
  - public readable site_content_entries where is_public = true and the parent site is published
  - public readable services where is_active = true and the parent site is published
  - public inserts for inquiries for published sites
  - public inserts for site_events for published sites
  - public inserts needed for booking creation only if the product flow truly depends on direct client inserts; otherwise recommend a more secure alternative
  - public payment checkout creation should be handled by edge functions, not direct client-side writes to Stripe secrets
- If public insert policies are needed, scope them tightly to published sites only.

14. important audit questions to answer
- Does client_sites currently include is_published? If not, add it.
- Does appointment_status currently include requested? If not, migrate it safely.
- Are public policies too broad anywhere? If so, tighten them.
- Are any required unique constraints missing, especially on site_content_entries(site_id, content_key)?
- Are there any missing foreign keys, nullability issues, or unsafe defaults?
- Can the template-based page builder run entirely from site_blocks plus existing site metadata? If yes, prefer that simpler model over introducing new schema.
- Can Stripe Connect site-level settings live safely in client_sites.settings? If yes, prefer that over introducing a separate payment-settings table right now.

15. output format
- First, summarize what already exists and what is missing.
- Then provide the exact SQL migration block.
- Then provide a short verification checklist I can run manually after the SQL finishes.

Important constraints:
- Make the SQL safe to run on a project that may already contain part of this schema.
- Prefer ALTER TABLE, DO blocks, IF NOT EXISTS, and conditional enum additions where possible.
- Preserve existing data.
- Do not remove tables unless absolutely necessary.
- If something should not be done client-side for security reasons, say so clearly and provide the safer Supabase-native alternative.
```