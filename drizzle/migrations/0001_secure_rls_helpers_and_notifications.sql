CREATE SCHEMA IF NOT EXISTS app_private;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION app_private.is_gestor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'rh')
  );
$$;

CREATE OR REPLACE FUNCTION app_private.lidera_equipe(_user_id uuid, _equipe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipes
    WHERE id = _equipe_id AND lider_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.is_gestor(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.lidera_equipe(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.is_gestor(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.lidera_equipe(uuid, uuid) TO authenticated, service_role;

ALTER POLICY profiles_admin_all ON public.profiles
  USING (app_private.has_role(auth.uid(), 'admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'));
ALTER POLICY profiles_select_gestor ON public.profiles
  USING (app_private.is_gestor(auth.uid()));
ALTER POLICY profiles_select_lider ON public.profiles
  USING (app_private.lidera_equipe(auth.uid(), equipe_id));
ALTER POLICY equipes_admin_write ON public.equipes
  USING (app_private.has_role(auth.uid(), 'admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'));
ALTER POLICY user_roles_select_gestor ON public.user_roles
  USING (app_private.is_gestor(auth.uid()));
ALTER POLICY categorias_gestor_write ON public.categorias
  USING (app_private.is_gestor(auth.uid()))
  WITH CHECK (app_private.is_gestor(auth.uid()));
ALTER POLICY ideias_select_gestor ON public.ideias
  USING (app_private.is_gestor(auth.uid()));
ALTER POLICY ideias_select_lider ON public.ideias
  USING (app_private.lidera_equipe(auth.uid(), equipe_id));
ALTER POLICY ideias_update_gestor ON public.ideias
  USING (app_private.is_gestor(auth.uid()))
  WITH CHECK (app_private.is_gestor(auth.uid()));
ALTER POLICY ideias_delete_admin ON public.ideias
  USING (app_private.has_role(auth.uid(), 'admin'));
ALTER POLICY historico_select ON public.historico_tramitacoes
  USING (
    EXISTS (
      SELECT 1 FROM public.ideias i
      WHERE i.id = ideia_id
        AND (
          i.autor_id = auth.uid()
          OR app_private.is_gestor(auth.uid())
          OR app_private.lidera_equipe(auth.uid(), i.equipe_id)
        )
    )
  );
ALTER POLICY historico_insert ON public.historico_tramitacoes
  WITH CHECK (
    app_private.is_gestor(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.ideias i
      WHERE i.id = ideia_id AND i.autor_id = auth.uid()
    )
  );
ALTER POLICY audit_select_admin ON public.audit_logs
  USING (app_private.has_role(auth.uid(), 'admin'));
ALTER POLICY okrs_gestor_write ON public.okrs
  USING (app_private.is_gestor(auth.uid()))
  WITH CHECK (app_private.is_gestor(auth.uid()));

ALTER POLICY notificacoes_insert ON public.notificacoes
  WITH CHECK (
    app_private.is_gestor(auth.uid())
    AND ideia_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.ideias i
      WHERE i.id = ideia_id AND i.autor_id = user_id
    )
  );

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE ALL ON FUNCTION public.is_gestor(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.lidera_equipe(uuid, uuid) FROM authenticated;