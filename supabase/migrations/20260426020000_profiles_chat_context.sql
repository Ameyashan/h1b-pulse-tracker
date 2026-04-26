-- Phase 1: extend profiles with chat-context fields used by Pulse AI to
-- personalize answers (lottery status, visa status, degree, employer, etc.).

alter table public.profiles
  add column if not exists current_visa_status text,
  add column if not exists lottery_status text,
  add column if not exists degree_level text,
  add column if not exists field_of_study text,
  add column if not exists employer_type text,
  add column if not exists country_of_birth text,
  add column if not exists chat_onboarding_completed_at timestamptz;

-- Allow users to update their own profile so onboarding can persist answers.
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Allow users to insert their own row defensively (the auth trigger
-- usually creates it, but onboarding should not 500 if it is missing).
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
