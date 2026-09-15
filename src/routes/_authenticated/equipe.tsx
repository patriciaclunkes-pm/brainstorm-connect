import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { StatusBadge } from "@/components/StatusBadge";
import { formatarData, type IdeiaStatus } from "@/lib/ideias";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Ideias da minha equipe — Espaço Aberto" },
      {
        name: "description",
        content: "Acompanhe as ideias registradas pelas pessoas da equipe que você lidera.",
      },
      { property: "og:title", content: "Ideias da minha equipe — Espaço Aberto" },
      { property: "og:description", content: "Ideias registradas pela equipe que você lidera." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MinhaEquipe,
});

type Linha = {
  id: string;
  titulo: string;
  status: IdeiaStatus;
  data_registro: string;
  categorias: { nome: string } | null;
  profiles: { nome: string } | null;
  equipes: { nome: string } | null;
};

function MinhaEquipe() {
  const { data: sessao } = useSessao();

  const { data: ideias = [], isLoading } = useQuery({
    queryKey: ["ideias-equipe", sessao?.userId],
    enabled: !!sessao,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideias")
        .select(
          "id, titulo, status, data_registro, categorias(nome), profiles!ideias_autor_id_fkey(nome), equipes(nome)",
        )
        .order("data_registro", { ascending: false });
      if (error) throw error;
      return data as unknown as Linha[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ideias da minha equipe</h1>
        <p className="text-sm text-muted-foreground">
          Visualização das contribuições das pessoas que você lidera.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contribuições</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="py-6 text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && ideias.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sua equipe ainda não registrou ideias.
            </p>
          )}
          <div className="divide-y divide-border">
            {ideias.map((i) => (
              <Link
                key={i.id}
                to="/ideias/$id"
                params={{ id: i.id }}
                className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.profiles?.nome ?? "Autor"} • {i.categorias?.nome ?? "Sem categoria"} •{" "}
                    {formatarData(i.data_registro)}
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
