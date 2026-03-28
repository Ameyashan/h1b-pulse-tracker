CREATE TABLE public.notification_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage notification_emails"
  ON public.notification_emails
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert notification_emails"
  ON public.notification_emails
  FOR INSERT
  TO anon
  WITH CHECK (true);
