
CREATE TABLE public.petition_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  update_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'not_yet_filed',
  processing_type text NOT NULL DEFAULT 'regular',
  service_center text NOT NULL,
  wage_level text NOT NULL,
  education text NOT NULL,
  job_category text,
  filing_date text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.petition_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous submissions)
CREATE POLICY "Anyone can insert petition entries"
  ON public.petition_entries FOR INSERT TO anon
  WITH CHECK (true);

-- Anyone can read petition entries (public dashboard)
CREATE POLICY "Petition entries are publicly readable"
  ON public.petition_entries FOR SELECT TO public
  USING (true);

-- Service role can do everything
CREATE POLICY "Service role can manage petition entries"
  ON public.petition_entries FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Anon can update (for update code flow)
CREATE POLICY "Anyone can update petition entries"
  ON public.petition_entries FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.petition_entries;
