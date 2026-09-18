import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TRANSICOES, STATUS_LABEL, type IdeiaStatus } from "@/lib/ideias";

const statusSchema = z.enum([
  "aguardando_avaliacao",
  "em_avaliacao",
  "aguardando_informacoes",
  "aprovada",
  "em_roadmap",
  "recusada",
  "implementada",
]);

async function auditar(
  userId: string,
  acao: string,
  entidade: string,
  entidadeId: string,
  detalhes: Record<string, string | number | boolean | null>,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("audit_logs")
    .insert({ user_id: userId, acao, entidade, entidade_id: entidadeId, detalhes });
}

export const transicionarStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        ideiaId: z.string().uuid(),
        novoStatus: statusSchema,
        parecer: z.string().trim().max(3000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: papel, error: papelError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "rh"])
      .maybeSingle();
    if (papelError || !papel)
      throw new Error("Apenas RH e administradores podem alterar o status.");

    const { data: ideia, error } = await supabase
      .from("ideias")
      .select("id, status, autor_id, titulo")
      .eq("id", data.ideiaId)
      .maybeSingle();
    if (error || !ideia) throw new Error("Ideia não encontrada.");

    const atual = ideia.status as IdeiaStatus;
    const novo = data.novoStatus as IdeiaStatus;
    if (atual === novo) throw new Error("A ideia já está neste status.");
    if (!TRANSICOES[atual].includes(novo)) {
      throw new Error(
        `Transição não permitida de "${STATUS_LABEL[atual]}" para "${STATUS_LABEL[novo]}".`,
      );
    }

    const parecer = data.parecer?.trim() ?? "";
    if ((novo === "recusada" || novo === "aguardando_informacoes") && parecer.length < 5) {
      throw new Error(
        novo === "recusada"
          ? "Informe o motivo da recusa para concluir a ação."
          : "Descreva quais informações são necessárias.",
      );
    }

    const update: { status: IdeiaStatus; motivo_recusa?: string } = { status: novo };
    if (novo === "recusada") update.motivo_recusa = parecer;

    const { error: upErr } = await supabase.from("ideias").update(update).eq("id", ideia.id);
    if (upErr) throw new Error(upErr.message);

    await supabase.from("historico_tramitacoes").insert({
      ideia_id: ideia.id,
      avaliador_id: userId,
      status_anterior: atual,
      novo_status: novo,
      parecer_texto: parecer || null,
    });

    await supabase.from("notificacoes").insert({
      user_id: ideia.autor_id,
      ideia_id: ideia.id,
      mensagem: `Sua ideia "${ideia.titulo}" mudou para ${STATUS_LABEL[novo]}.`,
    });

    await auditar(userId, "alterar_status", "ideia", ideia.id, { de: atual, para: novo });
    return { ok: true };
  });

export const editarIdeia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        ideiaId: z.string().uuid(),
        titulo: z.string().trim().min(5).max(150),
        descricao: z.string().trim().min(20).max(5000),
        categoriaId: z.string().uuid(),
        okrId: z.string().uuid().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ideia, error } = await supabase
      .from("ideias")
      .select("id, autor_id, status, titulo, descricao, categoria_id, okr_id")
      .eq("id", data.ideiaId)
      .maybeSingle();

    if (error || !ideia) throw new Error("Ideia não encontrada.");
    if (ideia.autor_id !== userId) throw new Error("Somente o autor pode editar a ideia.");
    if (!(["aguardando_avaliacao", "aguardando_informacoes"] as string[]).includes(ideia.status)) {
      throw new Error("Esta ideia não pode mais ser editada.");
    }

    if (data.categoriaId !== ideia.categoria_id) {
      const { data: categoria } = await supabase
        .from("categorias")
        .select("id")
        .eq("id", data.categoriaId)
        .eq("ativo", true)
        .maybeSingle();
      if (!categoria) throw new Error("Selecione uma categoria ativa.");
    }

    if (data.okrId && data.okrId !== ideia.okr_id) {
      const { data: okr } = await supabase
        .from("okrs")
        .select("id")
        .eq("id", data.okrId)
        .eq("ativo", true)
        .maybeSingle();
      if (!okr) throw new Error("Selecione um OKR ativo.");
    }

    const { error: updateError } = await supabase
      .from("ideias")
      .update({
        titulo: data.titulo,
        descricao: data.descricao,
        categoria_id: data.categoriaId,
        okr_id: data.okrId,
      })
      .eq("id", ideia.id)
      .eq("autor_id", userId)
      .eq("status", ideia.status);
    if (updateError) throw new Error(updateError.message);

    await auditar(userId, "editar", "ideia", ideia.id, {
      titulo_alterado: ideia.titulo !== data.titulo,
      descricao_alterada: ideia.descricao !== data.descricao,
      categoria_alterada: ideia.categoria_id !== data.categoriaId,
      okr_alterado: ideia.okr_id !== data.okrId,
      status: ideia.status,
    });
    return { ok: true };
  });

export const complementarIdeia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        ideiaId: z.string().uuid(),
        complemento: z.string().trim().min(5).max(3000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ideia, error } = await supabase
      .from("ideias")
      .select("id, status, autor_id, titulo, descricao")
      .eq("id", data.ideiaId)
      .maybeSingle();
    if (error || !ideia) throw new Error("Ideia não encontrada.");
    if (ideia.autor_id !== userId) throw new Error("Somente o autor pode complementar a ideia.");
    if (ideia.status !== "aguardando_informacoes")
      throw new Error("Esta ideia não está aguardando informações.");

    const novaDescricao = `${ideia.descricao}\n\n--- Complemento enviado em ${new Date().toLocaleString("pt-BR")} ---\n${data.complemento}`;

    const { error: upErr } = await supabase
      .from("ideias")
      .update({ status: "em_avaliacao", descricao: novaDescricao })
      .eq("id", ideia.id);
    if (upErr) throw new Error(upErr.message);

    await supabase.from("historico_tramitacoes").insert({
      ideia_id: ideia.id,
      avaliador_id: userId,
      status_anterior: "aguardando_informacoes",
      novo_status: "em_avaliacao",
      parecer_texto: data.complemento,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: gestores } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "rh"]);
    if (gestores?.length) {
      await supabaseAdmin.from("notificacoes").insert(
        gestores.map((g) => ({
          user_id: g.user_id,
          ideia_id: ideia.id,
          mensagem: `A ideia "${ideia.titulo}" recebeu as informações solicitadas.`,
        })),
      );
    }

    await auditar(userId, "complementar", "ideia", ideia.id, {});
    return { ok: true };
  });
