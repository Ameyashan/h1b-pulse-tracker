-- Profiles, daily query usage, and atomic increment RPCs for auth + rate limiting.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.query_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);

create table if not exists public.anon_query_usage (
  ip_hash text not null,
  day date not null,
  count int not null default 0,
  primary key (ip_hash, day)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.increment_user_usage(p_user_id uuid, p_day date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into public.query_usage (user_id, day, count)
  values (p_user_id, p_day, 1)
  on conflict (user_id, day)
  do update set count = public.query_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

create or replace function public.increment_anon_usage(p_ip_hash text, p_day date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into public.anon_query_usage (ip_hash, day, count)
  values (p_ip_hash, p_day, 1)
  on conflict (ip_hash, day)
  do update set count = public.anon_query_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

alter table public.profiles enable row level security;
alter table public.query_usage enable row level security;
alter table public.anon_query_usage enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "read own usage" on public.query_usage;
create policy "read own usage" on public.query_usage
  for select using (auth.uid() = user_id);
