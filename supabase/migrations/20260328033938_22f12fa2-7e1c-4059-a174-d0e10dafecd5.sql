-- Add new columns for self-reporting
ALTER TABLE public.signals
  ADD COLUMN wage_level TEXT CHECK (wage_level IN ('1', '2', '3', '4')),
  ADD COLUMN education_level TEXT CHECK (education_level IN ('Masters', 'Bachelors', 'Other'));

-- Create index for filtering
CREATE INDEX idx_signals_wage_level ON public.signals (wage_level);
CREATE INDEX idx_signals_education_level ON public.signals (education_level);

-- Allow anonymous users to insert their own reports
CREATE POLICY "Anyone can submit a report" ON public.signals
  FOR INSERT TO anon WITH CHECK (
    classification IN ('selected', 'not_selected')
    AND wage_level IS NOT NULL
    AND education_level IS NOT NULL
  );