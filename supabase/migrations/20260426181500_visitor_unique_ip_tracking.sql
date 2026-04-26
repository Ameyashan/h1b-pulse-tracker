-- Track unique visitors by hashed IP. The hash is computed in the edge
-- function (sha256 of ip + a server-side secret) so raw IPs never enter
-- the database.
CREATE TABLE IF NOT EXISTS public.visitor_ips (
  ip_hash text PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_ips ENABLE ROW LEVEL SECURITY;
-- No public policies: only the SECURITY DEFINER function below writes here.

CREATE OR REPLACE FUNCTION public.register_visitor(p_ip_hash text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer := 0;
  current_count integer;
BEGIN
  IF p_ip_hash IS NOT NULL AND length(p_ip_hash) > 0 THEN
    INSERT INTO public.visitor_ips (ip_hash) VALUES (p_ip_hash)
    ON CONFLICT (ip_hash) DO NOTHING;
    GET DIAGNOSTICS affected = ROW_COUNT;
  END IF;

  IF affected > 0 THEN
    UPDATE public.app_config
    SET value = to_jsonb((value::text::integer) + 1), updated_at = now()
    WHERE key = 'visitor_count'
    RETURNING (value::text::integer) INTO current_count;
  ELSE
    SELECT (value::text::integer) INTO current_count
    FROM public.app_config WHERE key = 'visitor_count';
  END IF;

  RETURN current_count;
END;
$$;

REVOKE ALL ON FUNCTION public.register_visitor(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_visitor(text) TO anon, authenticated, service_role;
