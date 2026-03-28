ALTER TABLE public.signals DROP CONSTRAINT signals_source_type_check;
ALTER TABLE public.signals ADD CONSTRAINT signals_source_type_check CHECK (source_type IN ('post', 'comment', 'self_report'));