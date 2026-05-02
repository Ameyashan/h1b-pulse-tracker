-- KB ingest cron schedule. Apply ONLY AFTER:
--   1. Edge functions kb-process-queue and kb-seed-policy-manual are deployed.
--   2. VOYAGE_API_KEY is set in edge-function secrets.
--   3. The service role key is stored in supabase_vault.secrets under
--      the name 'kb_cron_service_role'.
--
-- To stash the service role key in vault (one-time, run via the SQL editor
-- or psql; do NOT commit the key to source control):
--
--   select vault.create_secret(
--     '<your-service-role-key>',
--     'kb_cron_service_role',
--     'Service role key used by pg_cron to invoke kb-process-queue'
--   );
--
-- Then this migration wires up the schedule.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Helper: read the service role key out of vault. Defined as security definer
-- so cron can read the decrypted secret without granting decryption rights
-- to anon/authenticated.
create or replace function public._kb_cron_service_role_key()
returns text
language plpgsql
security definer
set search_path = vault, public
as $$
declare
  k text;
begin
  select decrypted_secret into k
    from vault.decrypted_secrets
   where name = 'kb_cron_service_role'
   limit 1;
  return k;
end;
$$;
revoke all on function public._kb_cron_service_role_key() from public, anon, authenticated;

-- Project ref is hardcoded; update if you ever clone the project.
-- Schedule: every 15 minutes, n=8 per tick. Steady-state cost is ~96
-- ticks/day; queue drains a weekly re-seed (~250 URLs) within ~8 hours.
select cron.schedule(
  'kb-process-queue-tick',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://rkwcpnoqnxporjqqlxjt.supabase.co/functions/v1/kb-process-queue?n=8',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || public._kb_cron_service_role_key(),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);

-- (Optional) re-seed the policy manual once a week so updated USCIS guidance
-- gets re-fetched and re-embedded if content_hash changed.
select cron.schedule(
  'kb-seed-policy-manual-weekly',
  '0 7 * * 1',  -- Mondays at 07:00 UTC
  $$
  select net.http_post(
    url := 'https://rkwcpnoqnxporjqqlxjt.supabase.co/functions/v1/kb-seed-policy-manual',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || public._kb_cron_service_role_key(),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To unschedule (for manual debugging):
--   select cron.unschedule('kb-process-queue-tick');
--   select cron.unschedule('kb-seed-policy-manual-weekly');
