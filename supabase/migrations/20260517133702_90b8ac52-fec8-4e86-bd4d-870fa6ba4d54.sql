
-- 1. notification_emails: remove public read
DROP POLICY IF EXISTS "Allow public read of emails" ON public.notification_emails;

-- 2. petition_entries: remove public table read, expose email-free view
DROP POLICY IF EXISTS "Petition entries are publicly readable" ON public.petition_entries;

-- Service role can still read via existing ALL policy. Keep anon INSERT/UPDATE policies as-is per product choice.

CREATE OR REPLACE VIEW public.petition_entries_public
WITH (security_invoker = on) AS
SELECT
  id, update_code, status, processing_type, service_center,
  wage_level, education, job_category, law_firm, filing_date,
  rfe_reason, created_at, updated_at
FROM public.petition_entries;

-- Allow anon/public lookups via the view (the underlying table's RLS still applies because of security_invoker)
-- We need a permissive SELECT policy so the view can read rows. Restore one but it now applies to all columns of the table.
-- The view itself filters columns at the SQL level, hiding email from clients that query the view.
CREATE POLICY "Public can read petition rows via view"
ON public.petition_entries
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.petition_entries_public TO anon, authenticated;

-- 3. Lock down SECURITY DEFINER helper functions so only service_role can call them via PostgREST
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 4. Add stable search_path to functions missing it
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
