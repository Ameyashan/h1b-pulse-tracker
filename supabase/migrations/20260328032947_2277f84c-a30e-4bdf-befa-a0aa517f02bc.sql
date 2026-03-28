-- Drop overly permissive policies
DROP POLICY "Service role can insert signals" ON public.signals;
DROP POLICY "Service role can update signals" ON public.signals;

-- Restrict insert/update to service role only (no authenticated user can write)
CREATE POLICY "Only service role can insert signals" ON public.signals
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Only service role can update signals" ON public.signals
  FOR UPDATE TO service_role USING (true);