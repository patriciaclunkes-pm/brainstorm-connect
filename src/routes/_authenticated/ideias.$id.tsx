import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { StatusBadge } from "@/components/StatusBadge";
import { complementarIdeia, editarIdeia, transicionarStatus } from "@/lib/tramitacoes.functions";
import { formatarData, STATUS_LABEL, TRANSICOES, type IdeiaStatus } from "@/lib/ideias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/ideias/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da ideia — Espaço Aberto" },
      {
        name: "description",
        content: "Veja os dados da ideia e a linha do tempo completa dos retornos do RH.",
      },
      { property: "og:title", content: "Detalhe da ideia — Espaço Aberto" },
      { property: "og:description", content: "Dados da ideia e linha do tempo dos retornos." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DetalheIdeia,
});

type Ideia = {
  id: string;
  titulo: string;
  descricao: string;
  status: IdeiaStatus;
  motivo_recusa: string | null;
  data_registro: string;
  autor_id: string;
  categoria_id: string;
  categorias: { id: string; nome: string } | null;
  profiles: { nome: string } | null;
  equipes: { nome: string } | null;
};

function DetalheIdeia() {
  const { id } = Route.useParams();
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const transicionar = useServerFn(transicionarStatus);
  const complementar = useServerFn(complementarIdeia);
  const editar = useServerFn(editarIdeia);

  const [novoStatus, setNovoStatus] = useState("");
  const [parecer, setParecer] = useState("");
  const [complemento, setComplemento] = useState("");
  const [editando, setEditando] = useState(false);
  const [tituloEdicao, setTituloEdicao] = useState("");
  const [descricaoEdicao, setDescricaoEdicao] = useState("");
  const [categoriaEdicao, setCategoriaEdicao] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const { data: ideia, isLoading } = useQuery({
    queryKey: ["ideia", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideias")
        .select(
          "id, titulo, descricao, status, motivo_recusa, data_registro, autor_id, categoria_id, categorias(id, nome), profiles!ideias_autor_id_fkey(nome), equipes(nome)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Ideia | null;
    },
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-edicao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nome, ativo")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: historico = [] } = useQuery({
    queryKey: ["historico", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_tramitacoes")
        .select("id, status_anterior, novo_status, parecer_texto, data_tramitacao, profiles(nome)")
        .eq("ideia_id", id)
        .order("data_tramitacao", { ascending: true });
      if (error) throw error;
      return data as unknown as {
        id: string;
        status_anterior: IdeiaStatus | null;
        novo_status: IdeiaStatus;
        parecer_texto: string | null;
        data_tramitacao: string;
        profiles: { nome: string } | null;
      }[];
    },
  });

  function recarregar() {
    queryClient.invalidateQueries({ queryKey: ["ideia", id] });
    queryClient.invalidateQueries({ queryKey: ["historico", id] });
    queryClient.invalidateQueries({ queryKey: ["minhas-ideias"] });
    queryClient.invalidateQueries({ queryKey: ["todas-ideias"] });
    queryClient.invalidateQueries({ queryKey: ["notificacoes-count"] });
  }

  async function aplicarStatus() {
    if (!novoStatus) {
      toast.error("Selecione o novo status.");
      return;
    }
    if (
      (novoStatus === "recusada" || novoStatus === "aguardando_informacoes") &&
      parecer.trim().length < 5
    ) {
      toast.error(
        novoStatus === "recusada"
          ? "Informe o motivo da recusa para concluir a ação."
          : "Descreva quais informações são necessárias.",
      );
      return;
    }
    setOcupado(true);
    try {
      await transicionar({
        data: { ideiaId: id, novoStatus: novoStatus as IdeiaStatus, parecer },
      });
      toast.success("Status atualizado.");
      setParecer("");
      setNovoStatus("");
      recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o status.");
    } finally {
      setOcupado(false);
    }
  }

  async function enviarComplemento() {
    setOcupado(true);
    try {
      await complementar({ data: { ideiaId: id, complemento } });
      toast.success("Informações enviadas. A ideia voltou para avaliação.");
      setComplemento("");
      recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar as informações.");
    } finally {
      setOcupado(false);
    }
  }

  function iniciarEdicao() {
    if (!ideia) return;
    setTituloEdicao(ideia.titulo);
    setDescricaoEdicao(ideia.descricao);
    setCategoriaEdicao(ideia.categoria_id);
    setEditando(true);
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (tituloEdicao.trim().length < 5) {
      toast.error("Informe um título com pelo menos 5 caracteres.");
      return;
    }
    if (descricaoEdicao.trim().length < 20) {
      toast.error("Descreva a ideia com pelo menos 20 caracteres.");
      return;
    }
    if (!categoriaEdicao) {
      toast.error("Selecione uma categoria.");
      return;
    }

    setOcupado(true);
    try {
      await editar({
        data: {
          ideiaId: id,
          titulo: tituloEdicao,
          descricao: descricaoEdicao,
          categoriaId: categoriaEdicao,
        },
      });
      toast.success("Ideia atualizada.");
      setEditando(false);
      recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível editar a ideia.");
    } finally {
      setOcupado(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!ideia)
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ideia não encontrada ou fora do seu alcance de acesso.
        </p>
        <Button asChild variant="outline">
          <Link to="/inicio">Voltar</Link>
        </Button>
      </div>
    );

  const ehAutor = sessao?.userId === ideia.autor_id;
  const podeEditar =
    ehAutor && ["aguardando_avaliacao", "aguardando_informacoes"].includes(ideia.status);
  const proximos = TRANSICOES[ideia.status];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/inicio">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{ideia.titulo}</CardTitle>
              <CardDescription>
                {ideia.profiles?.nome ?? "Autor"} • {ideia.equipes?.nome ?? "Sem equipe"} •{" "}
                {ideia.categorias?.nome ?? "Sem categoria"} • {formatarData(ideia.data_registro)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={ideia.status} />
              {podeEditar && !editando && (
                <Button type="button" variant="outline" size="sm" onClick={iniciarEdicao}>
                  <Pencil className="size-4" />
                  Editar ideia
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editando ? (
            <form onSubmit={salvarEdicao} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo-edicao">Título</Label>
                <Input
                  id="titulo-edicao"
                  value={tituloEdicao}
                  onChange={(e) => setTituloEdicao(e.target.value)}
                  minLength={5}
                  maxLength={150}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria-edicao">Categoria</Label>
                <Select value={categoriaEdicao} onValueChange={setCategoriaEdicao}>
                  <SelectTrigger id="categoria-edicao">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias
                      .filter((categoria) => categoria.ativo || categoria.id === ideia.categoria_id)
                      .map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao-edicao">Descrição</Label>
                <Textarea
                  id="descricao-edicao"
                  value={descricaoEdicao}
                  onChange={(e) => setDescricaoEdicao(e.target.value)}
                  rows={8}
                  minLength={20}
                  maxLength={5000}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={ocupado}>
                  {ocupado ? "Salvando..." : "Salvar alterações"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={ocupado}
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{ideia.descricao}</p>
          )}
          {ideia.motivo_recusa && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Motivo da recusa</p>
              <p className="text-sm whitespace-pre-wrap">{ideia.motivo_recusa}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {ehAutor && ideia.status === "aguardando_informacoes" && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle>O RH solicitou informações</CardTitle>
            <CardDescription>
              Complemente sua ideia abaixo. Ao enviar, ela volta para avaliação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="complemento">Informações complementares</Label>
            <Textarea
              id="complemento"
              rows={5}
              maxLength={3000}
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
            />
            <Button onClick={enviarComplemento} disabled={ocupado || complemento.trim().length < 5}>
              Enviar informações
            </Button>
          </CardContent>
        </Card>
      )}

      {sessao?.isGestor && proximos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avaliação</CardTitle>
            <CardDescription>
              Registre o parecer e avance a ideia na esteira de avaliação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Novo status</Label>
              <Select value={novoStatus} onValueChange={setNovoStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {proximos.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parecer">
                Parecer
                {novoStatus === "recusada" || novoStatus === "aguardando_informacoes"
                  ? " (obrigatório)"
                  : " (opcional)"}
              </Label>
              <Textarea
                id="parecer"
                rows={4}
                maxLength={3000}
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
              />
            </div>
            <Button
              onClick={aplicarStatus}
              disabled={
                ocupado ||
                ((novoStatus === "recusada" || novoStatus === "aguardando_informacoes") &&
                  parecer.trim().length < 5)
              }
            >
              Salvar avaliação
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Linha do tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-5 border-l border-border pl-5">
            <li className="relative">
              <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary" />
              <p className="text-sm font-medium">Ideia registrada</p>
              <p className="text-xs text-muted-foreground">
                {formatarData(ideia.data_registro)} • {ideia.profiles?.nome}
              </p>
            </li>
            {historico.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary/60" />
                <p className="text-sm font-medium">
                  {h.status_anterior ? `${STATUS_LABEL[h.status_anterior]} → ` : ""}
                  {STATUS_LABEL[h.novo_status]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatarData(h.data_tramitacao)} • {h.profiles?.nome ?? "Sistema"}
                </p>
                {h.parecer_texto && (
                  <p className="mt-1 rounded-md bg-muted p-2 text-sm whitespace-pre-wrap">
                    {h.parecer_texto}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
