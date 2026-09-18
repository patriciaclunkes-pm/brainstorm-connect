import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const roleSchema = z.enum(["admin", "rh", "lider", "colaborador"]);

async function exigirAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Apenas administradores podem executar esta ação.");
}

async function registrarAuditoria(
  userId: string,
  acao: string,
  entidade: string,
  entidadeId: string | null,
  detalhes: Record<string, string | number | boolean | null>,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("audit_logs")
    .insert({ user_id: userId, acao, entidade, entidade_id: entidadeId, detalhes });
}

export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        nome: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(255),
        senha: z.string().min(8).max(72),
        role: roleSchema,
        equipeId: z.string().uuid().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome },
    });
    if (error || !created.user)
      throw new Error(error?.message ?? "Não foi possível criar a conta.");

    await supabaseAdmin
      .from("profiles")
      .update({ nome: data.nome, email: data.email, equipe_id: data.equipeId })
      .eq("id", created.user.id);
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
    await registrarAuditoria(context.userId, "criar", "usuario", created.user.id, {
      email: data.email,
      role: data.role,
    });

    return { ok: true, id: created.user.id };
  });

export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        nome: z.string().trim().min(2).max(120),
        role: roleSchema,
        equipeId: z.string().uuid().nullable(),
        ativo: z.boolean(),
        novaSenha: z.string().min(8).max(72).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin
      .from("profiles")
      .update({ nome: data.nome, equipe_id: data.equipeId, ativo: data.ativo })
      .eq("id", data.id);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: data.role });

    if (data.novaSenha) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        password: data.novaSenha,
      });
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.auth.admin.updateUserById(data.id, {
      ban_duration: data.ativo ? "none" : "876000h",
    });

    await registrarAuditoria(context.userId, "editar", "usuario", data.id, {
      role: data.role,
      ativo: data.ativo,
    });
    return { ok: true };
  });

export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    if (data.id === context.userId) throw new Error("Você não pode excluir a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    await registrarAuditoria(context.userId, "excluir", "usuario", data.id, {});
    return { ok: true };
  });

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: papel, error: papelError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "rh"])
      .maybeSingle();
    if (papelError || !papel) throw new Error("Sem permissão.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: perfis, error } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, email, ativo, equipe_id, created_at")
      .order("nome");
    if (error) throw new Error(error.message);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    return (perfis ?? []).map((p) => ({
      ...p,
      role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "colaborador",
    }));
  });
