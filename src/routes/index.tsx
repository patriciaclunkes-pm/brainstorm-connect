import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { criarAdminInicial, statusBootstrap } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Espaço Aberto — Portal de Ideias e Sugestões" },
      {
        name: "description",
        content:
          "Portal corporativo para colaboradores registrarem ideias e o RH avaliar, responder e acompanhar cada contribuição.",
      },
      { property: "og:title", content: "Espaço Aberto — Portal de Ideias e Sugestões" },
      {
        property: "og:description",
        content:
          "Registre ideias, acompanhe o parecer do RH e veja a linha do tempo de cada contribuição.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entrada,
});

function Entrada() {
  const navigate = useNavigate();
  const checarBootstrap = useServerFn(statusBootstrap);
  const criarAdmin = useServerFn(criarAdminInicial);

  const { data: bootstrap, refetch } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => checarBootstrap(),
  });

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setCarregando(false);
    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    navigate({ to: "/inicio", replace: true });
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      await criarAdmin({ data: { nome: nome.trim(), email: email.trim(), senha } });
      toast.success("Administrador criado. Faça o login para continuar.");
      setNome("");
      setSenha("");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar o administrador.");
    } finally {
      setCarregando(false);
    }
  }

  const precisaBootstrap = bootstrap?.precisaBootstrap === true;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Lightbulb className="size-6" />
        </span>
        <h1 className="text-3xl font-semibold">Espaço Aberto</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Canal oficial de ideias e sugestões. Registre sua contribuição e acompanhe o retorno do RH
          do começo ao fim.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{precisaBootstrap ? "Criar administrador inicial" : "Entrar"}</CardTitle>
          <CardDescription>
            {precisaBootstrap
              ? "Nenhuma conta existe ainda. Crie a conta de administrador para começar."
              : "Use o e-mail e a senha fornecidos pela administração do portal."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={precisaBootstrap ? criar : entrar} className="space-y-4">
            {precisaBootstrap && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={precisaBootstrap ? 8 : undefined}
                autoComplete={precisaBootstrap ? "new-password" : "current-password"}
              />
              {precisaBootstrap && (
                <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={carregando}>
              {precisaBootstrap ? "Criar administrador" : "Entrar"}
            </Button>
          </form>

          {!precisaBootstrap && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              As contas são criadas pela administração. Fale com o RH se não tiver acesso.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
