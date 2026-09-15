import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatarData } from "@/lib/ideias";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — Espaço Aberto" },
      { name: "description", content: "Avisos sobre o andamento das suas ideias no portal." },
      { property: "og:title", content: "Notificações — Espaço Aberto" },
      { property: "og:description", content: "Avisos sobre o andamento das suas ideias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notificacoes,
});

function Notificacoes() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("id, mensagem, lida, created_at, ideia_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function marcarTodas() {
    await supabase.from("notificacoes").update({ lida: true }).eq("lida", false);
    queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    queryClient.invalidateQueries({ queryKey: ["notificacoes-count"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notificações</h1>
          <p className="text-sm text-muted-foreground">Avisos sobre o andamento das ideias.</p>
        </div>
        <Button variant="outline" onClick={marcarTodas}>
          Marcar todas como lidas
        </Button>
      </div>

      {data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma notificação por enquanto.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {data.map((n) => (
          <Card key={n.id} className={n.lida ? "opacity-70" : "border-primary/40"}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-medium">{n.mensagem}</p>
                <p className="text-xs text-muted-foreground">{formatarData(n.created_at)}</p>
              </div>
              {n.ideia_id && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/ideias/$id" params={{ id: n.ideia_id }}>
                    Ver ideia
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
