CREATE TABLE public.not_selected_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.not_selected_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert not_selected_emails"
  ON public.not_selected_emails FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role can manage not_selected_emails"
  ON public.not_selected_emails FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);