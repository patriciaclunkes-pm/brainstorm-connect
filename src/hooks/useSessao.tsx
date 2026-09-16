import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PerfilRole } from "@/lib/ideias";

export type Sessao = {
  userId: string;
  nome: string;
  email: string;
  equipeId: string | null;
  role: PerfilRole;
  isGestor: boolean;
  isAdmin: boolean;
  isRh: boolean;
  isLider: boolean;
};

export function useSessao() {
  return useQuery<Sessao | null>({
    queryKey: ["sessao"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const [{ data: perfil }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, nome, email, equipe_id")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      const role = ((roles?.[0]?.role as PerfilRole) ?? "colaborador") as PerfilRole;
      return {
        userId: user.id,
        nome: perfil?.nome ?? user.email ?? "",
        email: perfil?.email ?? user.email ?? "",
        equipeId: perfil?.equipe_id ?? null,
        role,
        isGestor: role === "admin" || role === "rh",
        isAdmin: role === "admin",
        isRh: role === "rh",
        isLider: role === "lider",
      };
    },
  });
}
