CREATE TABLE IF NOT EXISTS news_cache (
  id text PRIMARY KEY DEFAULT 'latest',
  items jsonb NOT NULL DEFAULT '[]',
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read news_cache" ON news_cache
  FOR SELECT USING (true);
