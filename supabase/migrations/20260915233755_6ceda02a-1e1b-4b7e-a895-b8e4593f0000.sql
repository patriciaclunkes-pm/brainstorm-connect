-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'rh', 'lider', 'colaborador');
CREATE TYPE public.ideia_status AS ENUM (
  'aguardando_avaliacao','em_avaliacao','aguardando_informacoes','aprovada','em_roadmap','recusada','implementada'
);

-- EQUIPES
CREATE TABLE public.equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  lider_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipes TO authenticated;
GRANT ALL ON public.equipes TO service_role;
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  equipe_id uuid REFERENCES public.equipes(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.equipes ADD CONSTRAINT equipes_lider_fk FOREIGN KEY (lider_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_gestor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','rh'));
$$;

CREATE OR REPLACE FUNCTION public.lidera_equipe(_user_id uuid, _equipe_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.equipes e WHERE e.id = _equipe_id AND e.lider_id = _user_id);
$$;

-- CATEGORIAS
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  data_criacao timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- IDEIAS
CREATE TABLE public.ideias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  equipe_id uuid REFERENCES public.equipes(id) ON DELETE SET NULL,
  categoria_id uuid NOT NULL REFERENCES public.categorias(id),
  titulo text NOT NULL,
  descricao text NOT NULL,
  status public.ideia_status NOT NULL DEFAULT 'aguardando_avaliacao',
  motivo_recusa text,
  data_registro timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideias TO authenticated;
GRANT ALL ON public.ideias TO service_role;
ALTER TABLE public.ideias ENABLE ROW LEVEL SECURITY;

-- HISTORICO
CREATE TABLE public.historico_tramitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ideia_id uuid NOT NULL REFERENCES public.ideias(id) ON DELETE CASCADE,
  avaliador_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status_anterior public.ideia_status,
  novo_status public.ideia_status NOT NULL,
  parecer_texto text,
  data_tramitacao timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.historico_tramitacoes TO authenticated;
GRANT ALL ON public.historico_tramitacoes TO service_role;
ALTER TABLE public.historico_tramitacoes ENABLE ROW LEVEL SECURITY;

-- NOTIFICACOES
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ideia_id uuid REFERENCES public.ideias(id) ON DELETE CASCADE,
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  acao text NOT NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES: equipes
CREATE POLICY "equipes_select" ON public.equipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "equipes_admin_write" ON public.equipes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- POLICIES: profiles
CREATE POLICY "profiles_select_self" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_select_gestor" ON public.profiles FOR SELECT TO authenticated USING (public.is_gestor(auth.uid()));
CREATE POLICY "profiles_select_lider" ON public.profiles FOR SELECT TO authenticated USING (public.lidera_equipe(auth.uid(), equipe_id));
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- POLICIES: user_roles
CREATE POLICY "user_roles_select_self" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_gestor" ON public.user_roles FOR SELECT TO authenticated USING (public.is_gestor(auth.uid()));

-- POLICIES: categorias
CREATE POLICY "categorias_select" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_gestor_write" ON public.categorias FOR ALL TO authenticated
  USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));

-- POLICIES: ideias
CREATE POLICY "ideias_select_autor" ON public.ideias FOR SELECT TO authenticated USING (autor_id = auth.uid());
CREATE POLICY "ideias_select_gestor" ON public.ideias FOR SELECT TO authenticated USING (public.is_gestor(auth.uid()));
CREATE POLICY "ideias_select_lider" ON public.ideias FOR SELECT TO authenticated USING (public.lidera_equipe(auth.uid(), equipe_id));
CREATE POLICY "ideias_insert_autor" ON public.ideias FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());
CREATE POLICY "ideias_update_autor" ON public.ideias FOR UPDATE TO authenticated
  USING (autor_id = auth.uid() AND status IN ('aguardando_avaliacao','aguardando_informacoes'))
  WITH CHECK (autor_id = auth.uid());
CREATE POLICY "ideias_update_gestor" ON public.ideias FOR UPDATE TO authenticated
  USING (public.is_gestor(auth.uid())) WITH CHECK (public.is_gestor(auth.uid()));
CREATE POLICY "ideias_delete_admin" ON public.ideias FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- POLICIES: historico
CREATE POLICY "historico_select" ON public.historico_tramitacoes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ideias i WHERE i.id = ideia_id AND (
    i.autor_id = auth.uid() OR public.is_gestor(auth.uid()) OR public.lidera_equipe(auth.uid(), i.equipe_id)
  ))
);
CREATE POLICY "historico_insert" ON public.historico_tramitacoes FOR INSERT TO authenticated WITH CHECK (
  public.is_gestor(auth.uid()) OR EXISTS (SELECT 1 FROM public.ideias i WHERE i.id = ideia_id AND i.autor_id = auth.uid())
);

-- POLICIES: notificacoes
CREATE POLICY "notificacoes_select_own" ON public.notificacoes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notificacoes_update_own" ON public.notificacoes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notificacoes_insert" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);

-- POLICIES: audit
CREATE POLICY "audit_select_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ideias_updated BEFORE UPDATE ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.categorias (nome) VALUES ('Infraestrutura'),('Processos'),('Pessoas'),('Tecnologia');