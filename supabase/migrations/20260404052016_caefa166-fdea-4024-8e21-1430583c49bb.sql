CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message text,
  page text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
  ON public.feedback FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Service role can manage feedback"
  ON public.feedback FOR ALL TO service_role
  USING (true) WITH CHECK (true);