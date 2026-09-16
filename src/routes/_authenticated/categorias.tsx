import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Espaço Aberto" },
      {
        name: "description",
        content: "Cadastre e organize as categorias usadas na classificação das ideias do portal.",
      },
      { property: "og:title", content: "Categorias — Espaço Aberto" },
      { property: "og:description", content: "Cadastro de categorias de ideias do portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Categorias,
});

function Categorias() {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["categorias-todas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nome, ativo, data_criacao")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  function recarregar() {
    queryClient.invalidateQueries({ queryKey: ["categorias-todas"] });
    queryClient.invalidateQueries({ queryKey: ["categorias-ativas"] });
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 3) {
      toast.error("Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("categorias").insert({ nome: nome.trim() });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível criar a categoria. O nome já pode existir.");
      return;
    }
    setNome("");
    recarregar();
    toast.success("Categoria criada.");
  }

  async function salvarNome(id: string) {
    if (nomeEdicao.trim().length < 3) {
      toast.error("Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    const { error } = await supabase
      .from("categorias")
      .update({ nome: nomeEdicao.trim() })
      .eq("id", id);
    if (error) {
      toast.error("Não foi possível salvar.");
      return;
    }
    setEditandoId(null);
    recarregar();
    toast.success("Categoria atualizada.");
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    const { error } = await supabase.from("categorias").update({ ativo }).eq("id", id);
    if (error) {
      toast.error("Não foi possível alterar a situação.");
      return;
    }
    recarregar();
  }

  if (sessao && !sessao.isGestor) {
    return <p className="text-sm text-muted-foreground">Você não tem acesso a esta área.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <p className="text-sm text-muted-foreground">
          Categorias inativas somem do formulário de nova ideia, mas continuam nas ideias antigas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
          <CardDescription>O nome precisa ser único.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={criar} className="flex flex-wrap items-end gap-3">
            <div className="min-w-60 flex-1 space-y-2">
              <Label htmlFor="nome-categoria">Nome</Label>
              <Input
                id="nome-categoria"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={80}
                placeholder="Ex.: Bem-estar"
              />
            </div>
            <Button type="submit" disabled={salvando}>
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadastradas</CardTitle>
          <CardDescription>{categorias.length} categoria(s).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-32">Ativa</TableHead>
                  <TableHead className="w-40 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {editandoId === c.id ? (
                        <Input
                          value={nomeEdicao}
                          onChange={(e) => setNomeEdicao(e.target.value)}
                          maxLength={80}
                        />
                      ) : (
                        c.nome
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.ativo}
                        onCheckedChange={(v) => alternarAtivo(c.id, v)}
                        aria-label={`Ativar categoria ${c.nome}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {editandoId === c.id ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => salvarNome(c.id)}>
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditandoId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditandoId(c.id);
                            setNomeEdicao(c.nome);
                          }}
                        >
                          Editar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
