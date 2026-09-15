import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Lightbulb, LogOut, Bell } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { ROLE_LABEL } from "@/lib/ideias";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Item = { to: string; label: string };

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: sessao } = useSessao();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  const itens: Item[] = [{ to: "/inicio", label: "Início" }];
  if (sessao?.isGestor) itens.push({ to: "/avaliacao", label: "Avaliação" });
  if (sessao?.isLider) itens.push({ to: "/equipe", label: "Minha equipe" });
  if (sessao?.isGestor) itens.push({ to: "/categorias", label: "Categorias" });
  if (sessao?.isAdmin) {
    itens.push({ to: "/pessoas", label: "Pessoas" });
    itens.push({ to: "/equipes", label: "Equipes" });
  }

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/inicio" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Lightbulb className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold">Espaço Aberto</span>
          </Link>

          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {itens.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === item.to && "bg-accent text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/notificacoes"
              className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Notificações"
            >
              <Bell className="size-4" />
              {naoLidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {naoLidas}
                </span>
              )}
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{sessao?.nome}</p>
              <p className="text-xs text-muted-foreground">
                {sessao ? ROLE_LABEL[sessao.role] : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={sair}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
