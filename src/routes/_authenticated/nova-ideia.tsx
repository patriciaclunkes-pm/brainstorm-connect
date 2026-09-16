import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/nova-ideia")({
  head: () => ({
    meta: [
      { title: "Nova ideia — Espaço Aberto" },
      {
        name: "description",
        content: "Registre uma nova ideia com título, descrição e categoria para avaliação do RH.",
      },
      { property: "og:title", content: "Nova ideia — Espaço Aberto" },
      { property: "og:description", content: "Registre uma nova ideia para avaliação do RH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovaIdeia,
});

function NovaIdeia() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: sessao, isPending: carregandoSessao, isError: erroSessao } = useSessao();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (carregandoSessao) {
      toast.info("Aguarde enquanto seu acesso é carregado.");
      return;
    }
    if (erroSessao || !sessao) {
      toast.error("Não foi possível confirmar seu acesso. Atualize a página e tente novamente.");
      return;
    }
    if (titulo.trim().length < 5) {
      toast.error("Informe um título com pelo menos 5 caracteres.");
      return;
    }
    if (descricao.trim().length < 20) {
      toast.error("Descreva a ideia com pelo menos 20 caracteres.");
      return;
    }
    if (!categoriaId) {
      toast.error("Selecione uma categoria.");
      return;
    }

    setSalvando(true);
    try {
      const { data, error } = await supabase
        .from("ideias")
        .insert({
          autor_id: sessao.userId,
          equipe_id: sessao.equipeId,
          categoria_id: categoriaId,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
        })
        .select("id")
        .single();

      if (error || !data) {
        toast.error("Não foi possível registrar a ideia. Tente novamente em instantes.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["minhas-ideias"] });
      toast.success("Ideia registrada! Status: Aguardando avaliação.");
      navigate({ to: "/ideias/$id", params: { id: data.id } });
    } catch {
      toast.error("Não foi possível registrar a ideia. Verifique sua conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova ideia</h1>
        <p className="text-sm text-muted-foreground">
          Sua ideia entra na fila de avaliação do RH assim que for enviada.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da ideia</CardTitle>
          <CardDescription>Título, descrição e categoria são obrigatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                minLength={5}
                maxLength={150}
                placeholder="Resumo da sua ideia"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={8}
                minLength={20}
                maxLength={5000}
                placeholder="Explique a oportunidade, o benefício esperado e como imagina a execução."
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={salvando || carregandoSessao || erroSessao || !sessao}
              >
                {salvando ? "Enviando..." : carregandoSessao ? "Carregando..." : "Enviar ideia"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/inicio" })}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
