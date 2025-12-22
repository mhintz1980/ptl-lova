# Beta Deployment Guide

To deploy PumpTracker Lite for beta testing where multiple users can access the same data ("cloud mode"), follow these steps.

## Prerequisite: Shared Database (Supabase)

Since local storage is private to each user's browser, we need a shared cloud database.

1.  **Create a Free Project**: Go to [database.new](https://database.new) and create a new project.
2.  **Get API Keys**:
    - Go to **Project Settings > API**.
    - Copy the `Project URL` (e.g., `https://xyz.supabase.co`).
    - Copy the `anon` / `public` key.
3.  **Run SQL Setup**:
    - Go to the **SQL Editor** in your Supabase dashboard.
    - Paste and run the following script to create the table and enable secure access.

```sql
-- 1. Create the Pump table to match the TypeScript 'Pump' interface
create table public.pump (
  id uuid primary key,
  serial int not null,
  po text not null,
  customer text not null,
  model text not null,
  stage text not null,
  priority text not null,
  powder_color text,
  last_update timestamptz not null default now(),
  value numeric,

  -- Forecast / Projection fields
  "forecastEnd" timestamptz,
  "forecastStart" timestamptz,

  -- Pause state
  "isPaused" boolean default false,
  "pausedAt" timestamptz,
  "pausedStage" text,
  "totalPausedDays" int default 0,

  -- Domain Logic
  "work_hours" jsonb,
  "powderCoatVendorId" text
);

-- 2. Create the Order/Sales tables (Optional, for now we just use Pump aggregate)
-- (Skipping for Beta v1 simplicity)

-- 3. Enable Row Level Security (RLS)
-- For Beta: Allow ANYONE with the key to read/write.
-- In Production: You should restrict this to authenticated users.
alter table public.pump enable row level security;

create policy "Enable all access for all users"
on public.pump
for all
to public
using (true)
with check (true);
```

## Hosting (Vercel)

1.  **Push Code to GitHub**:
    - Ensure your latest changes are committed and pushed.
    - **Recommended**: Push your current changes to the `main` branch if you want this to be the primary beta version.
2.  **Import to Vercel**:
    - Go to [vercel.com/new](https://vercel.com/new).
    - Import your `pumptracker-lite` repository.
3.  **Configure Environment Variables**:
    - Expand "Environment Variables".
    - Add `VITE_SUPABASE_URL` = (Your Project URL)
    - Add `VITE_SUPABASE_ANON_KEY` = (Your Anon Key)
4.  **Deploy**: Click **Deploy**.

## Verification

Once deployed:

1.  Open the Vercel URL on Computer A.
2.  Add a new Purchase Order.
3.  Open the Vercel URL on Computer B.
4.  **Success**: You should see the same PO appear on Computer B automatically (or after a refresh).
