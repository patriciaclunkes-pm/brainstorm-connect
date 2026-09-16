import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { StatusBadge } from "@/components/StatusBadge";
import { formatarData, STATUS_LABEL, STATUS_ORDER, type IdeiaStatus } from "@/lib/ideias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Minhas ideias — Espaço Aberto" },
      {
        name: "description",
        content: "Acompanhe suas ideias, os status de avaliação e os retornos do RH.",
      },
      { property: "og:title", content: "Minhas ideias — Espaço Aberto" },
      { property: "og:description", content: "Acompanhe suas ideias e os retornos do RH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

type Linha = {
  id: string;
  titulo: string;
  status: IdeiaStatus;
  data_registro: string;
  categorias: { nome: string } | null;
};

function Inicio() {
  const { data: sessao } = useSessao();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>("todos");
  const [ordem, setOrdem] = useState<string>("recentes");

  const { data: ideias = [], isLoading } = useQuery({
    queryKey: ["minhas-ideias", sessao?.userId],
    enabled: !!sessao,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideias")
        .select("id, titulo, status, data_registro, categorias(nome)")
        .eq("autor_id", sessao!.userId)
        .order("data_registro", { ascending: false });
      if (error) throw error;
      return data as unknown as Linha[];
    },
  });

  const { data: naoLidas = 0 } = useQuery({
    queryKey: ["notificacoes-count", sessao?.userId],
    enabled: !!sessao,
    queryFn: async () => {
      const { count } = await supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("lida", false);
      return count ?? 0;
    },
  });

  const contadores = useMemo(() => {
    const por = (s: IdeiaStatus) => ideias.filter((i) => i.status === s).length;
    return {
      total: ideias.length,
      emAvaliacao: por("em_avaliacao") + por("aguardando_avaliacao"),
      aprovadas: por("aprovada") + por("implementada"),
      pendentes: por("aguardando_informacoes"),
    };
  }, [ideias]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = ideias.filter(
      (i) =>
        (status === "todos" || i.status === status) &&
        (termo === "" || i.titulo.toLowerCase().includes(termo)),
    );
    return [...lista].sort((a, b) => {
      if (ordem === "titulo") return a.titulo.localeCompare(b.titulo);
      if (ordem === "antigas")
        return new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime();
      return new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime();
    });
  }, [ideias, busca, status, ordem]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Olá, {sessao?.nome ?? ""}</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas contribuições e os retornos do RH.
          </p>
        </div>
        <Button asChild>
          <Link to="/nova-ideia">
            <Plus className="size-4" />
            Nova ideia
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Contador titulo="Total de ideias" valor={contadores.total} />
        <Contador titulo="Em avaliação" valor={contadores.emAvaliacao} />
        <Contador titulo="Aprovadas" valor={contadores.aprovadas} />
        <Contador titulo="Pendentes de ação" valor={contadores.pendentes} destaque />
      </div>

      {naoLidas > 0 && (
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm">
              Você tem <strong>{naoLidas}</strong> notificação(ões) não lida(s).
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/notificacoes">Ver notificações</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Minhas ideias</CardTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por título"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
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
            <Select value={ordem} onValueChange={setOrdem}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="antigas">Mais antigas</SelectItem>
                <SelectItem value="titulo">Título (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="py-6 text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && filtradas.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma ideia encontrada.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/nova-ideia">Registrar a primeira ideia</Link>
              </Button>
            </div>
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

function Contador({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <Card className={destaque && valor > 0 ? "border-warning/50" : undefined}>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{titulo}</p>
        <p className="mt-1 font-display text-3xl font-semibold">{valor}</p>
      </CardContent>
    </Card>
  );
}
