
CREATE TABLE public.submission_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.submission_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage submission_logs"
  ON public.submission_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_submission_logs_ip_created ON public.submission_logs (ip_address, created_at);
