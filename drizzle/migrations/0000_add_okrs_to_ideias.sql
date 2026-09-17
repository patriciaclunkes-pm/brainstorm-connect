CREATE TABLE public.okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  data_criacao timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.okrs TO authenticated;
GRANT ALL ON public.okrs TO service_role;

ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "okrs_select"
ON public.okrs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "okrs_gestor_write"
ON public.okrs
FOR ALL
TO authenticated
USING (public.is_gestor(auth.uid()))
WITH CHECK (public.is_gestor(auth.uid()));

ALTER TABLE public.ideias
ADD COLUMN okr_id uuid NULL REFERENCES public.okrs(id);

CREATE INDEX ideias_okr_id_idx ON public.ideias (okr_id);