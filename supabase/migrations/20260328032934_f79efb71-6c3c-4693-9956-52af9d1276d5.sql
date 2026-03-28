-- Create table for storing Reddit signals
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('post', 'comment')),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  permalink TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  created_utc TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score INTEGER NOT NULL DEFAULT 0,
  flair TEXT,
  classification TEXT NOT NULL DEFAULT 'noise' CHECK (classification IN ('selected', 'not_selected', 'waiting', 'noise')),
  confidence REAL NOT NULL DEFAULT 0,
  employer_mentions TEXT[] NOT NULL DEFAULT '{}',
  cap_type TEXT,
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw_json JSONB
);

-- Indexes for performance
CREATE INDEX idx_signals_created_utc ON public.signals (created_utc DESC);
CREATE INDEX idx_signals_classification ON public.signals (classification);
CREATE INDEX idx_signals_source_id ON public.signals (source_id);

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Public read access (this is public data from Reddit)
CREATE POLICY "Signals are publicly readable" ON public.signals
  FOR SELECT USING (true);

-- Only service role can insert/update (edge functions)
CREATE POLICY "Service role can insert signals" ON public.signals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update signals" ON public.signals
  FOR UPDATE USING (true);

-- Config table for admin settings
CREATE TABLE public.app_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config is publicly readable" ON public.app_config
  FOR SELECT USING (true);

-- Insert default config
INSERT INTO public.app_config (key, value) VALUES
  ('polling', '{"interval_minutes": 10, "subreddits": ["h1b"], "enabled": false}'::jsonb),
  ('keywords', '{"selected": ["selected", "got selected", "i was selected", "status changed to selected"], "not_selected": ["not selected", "wasnt selected", "rejected", "denial"], "waiting": ["still waiting", "no update", "submitted", "pending"]}'::jsonb),
  ('blocklist', '{"patterns": ["spam", "advertisement", "sell"]}'::jsonb);