import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { StatusBadge } from "@/components/StatusBadge";
import { formatarData, STATUS_LABEL, STATUS_ORDER, type IdeiaStatus } from "@/lib/ideias";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/avaliacao")({
  head: () => ({
    meta: [
      { title: "Painel de avaliação — Espaço Aberto" },
      {
        name: "description",
        content: "Painel do RH com todas as ideias da organização, filtros e indicadores.",
      },
      { property: "og:title", content: "Painel de avaliação — Espaço Aberto" },
      { property: "og:description", content: "Todas as ideias da organização em um só painel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Avaliacao,
});

type Linha = {
  id: string;
  titulo: string;
  status: IdeiaStatus;
  data_registro: string;
  equipe_id: string | null;
  categoria_id: string;
  categorias: { nome: string } | null;
  profiles: { nome: string } | null;
  equipes: { nome: string } | null;
};

function Avaliacao() {
  const { data: sessao } = useSessao();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [equipe, setEquipe] = useState("todas");
  const [categoria, setCategoria] = useState("todas");
  const [periodo, setPeriodo] = useState("todos");

  const { data: ideias = [], isLoading } = useQuery({
    queryKey: ["todas-ideias"],
    enabled: !!sessao?.isGestor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideias")
        .select(
          "id, titulo, status, data_registro, equipe_id, categoria_id, categorias(nome), profiles!ideias_autor_id_fkey(nome), equipes(nome)",
        )
        .order("data_registro", { ascending: false });
      if (error) throw error;
      return data as unknown as Linha[];
    },
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: async () => {
      const { data } = await supabase.from("equipes").select("id, nome").order("nome");
      return data ?? [];
    },
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data } = await supabase.from("categorias").select("id, nome").order("nome");
      return data ?? [];
    },
  });

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const limite =
      periodo === "todos"
        ? null
        : new Date(Date.now() - Number(periodo) * 24 * 60 * 60 * 1000).getTime();
    return ideias.filter(
      (i) =>
        (status === "todos" || i.status === status) &&
        (equipe === "todas" || i.equipe_id === equipe) &&
        (categoria === "todas" || i.categoria_id === categoria) &&
        (limite === null || new Date(i.data_registro).getTime() >= limite) &&
        (termo === "" ||
          i.titulo.toLowerCase().includes(termo) ||
          (i.profiles?.nome ?? "").toLowerCase().includes(termo)),
    );
  }, [ideias, busca, status, equipe, categoria, periodo]);

  const fila = ideias.filter((i) => i.status === "aguardando_avaliacao").length;
  const emAvaliacao = ideias.filter((i) => i.status === "em_avaliacao").length;
  const aguardando = ideias.filter((i) => i.status === "aguardando_informacoes").length;

  if (!sessao?.isGestor)
    return <p className="text-sm text-muted-foreground">Área restrita ao RH e administradores.</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Painel de avaliação</h1>
        <p className="text-sm text-muted-foreground">
          Todas as ideias registradas na organização.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador titulo="Na fila" valor={fila} />
        <Indicador titulo="Em avaliação" valor={emAvaliacao} />
        <Indicador titulo="Aguardando informações" valor={aguardando} />
        <Indicador titulo="Total" valor={ideias.length} />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Ideias</CardTitle>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Input
              placeholder="Buscar por título ou autor"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={equipe} onValueChange={setEquipe}>
              <SelectTrigger>
                <SelectValue placeholder="Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as equipes</SelectItem>
                {equipes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Qualquer data</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="py-6 text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && filtradas.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma ideia encontrada com esses filtros.
            </p>
          )}
          <div className="divide-y divide-border">
            {filtradas.map((i) => (
              <Link
                key={i.id}
                to="/ideias/$id"
                params={{ id: i.id }}
                className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.profiles?.nome ?? "Autor"} • {i.equipes?.nome ?? "Sem equipe"} •{" "}
                    {i.categorias?.nome ?? "Sem categoria"} • {formatarData(i.data_registro)}
                  </p>
                </div>
                <StatusBadge status={i.status} />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{titulo}</p>
        <p className="mt-1 font-display text-3xl font-semibold">{valor}</p>
      </CardContent>
    </Card>
  );
}
