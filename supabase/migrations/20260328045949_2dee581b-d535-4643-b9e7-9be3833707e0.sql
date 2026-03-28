
-- Seed a visitor_count row in app_config if not exists
INSERT INTO public.app_config (key, value) VALUES ('visitor_count', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create a function to atomically increment and return the count
CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE app_config
  SET value = to_jsonb((value::text::integer) + 1), updated_at = now()
  WHERE key = 'visitor_count'
  RETURNING (value::text::integer);
$$;
