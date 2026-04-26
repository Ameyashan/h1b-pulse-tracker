-- Log of every question sent to Pulse AI. Captures both signed-in users
-- (user_id set) and anonymous visitors (user_id null, is_anonymous true).
-- Used for product analytics on what users are asking.

create table if not exists public.pulse_query_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  is_anonymous boolean not null default false,
  ip_hash text,
  question text not null,
  answer_chars int,
  citation_count int,
  created_at timestamptz not null default now()
);

create index if not exists pulse_query_log_created_at_idx
  on public.pulse_query_log (created_at desc);

create index if not exists pulse_query_log_user_id_idx
  on public.pulse_query_log (user_id)
  where user_id is not null;

create index if not exists pulse_query_log_anon_idx
  on public.pulse_query_log (is_anonymous, created_at desc)
  where is_anonymous = true;

alter table public.pulse_query_log enable row level security;

-- No public read/write policies: writes happen via the edge function with the
-- service role key, and reads are admin-only via the Supabase dashboard.
