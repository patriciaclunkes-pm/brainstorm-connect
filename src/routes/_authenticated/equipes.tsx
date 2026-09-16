import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SEM_LIDER = "sem-lider";

export const Route = createFileRoute("/_authenticated/equipes")({
  head: () => ({
    meta: [
      { title: "Equipes — Espaço Aberto" },
      {
        name: "description",
        content: "Cadastre equipes do portal e defina quem é o líder responsável por cada uma.",
      },
      { property: "og:title", content: "Equipes — Espaço Aberto" },
      { property: "og:description", content: "Cadastro de equipes e líderes do portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Equipes,
});

function Equipes() {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  const { data: equipes = [], isLoading } = useQuery({
    queryKey: ["equipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipes")
        .select("id, nome, lider_id")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: pessoas = [] } = useQuery({
    queryKey: ["pessoas-basico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  function recarregar() {
    queryClient.invalidateQueries({ queryKey: ["equipes"] });
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 2) {
      toast.error("Informe um nome de equipe.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("equipes").insert({ nome: nome.trim() });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível criar a equipe. O nome já pode existir.");
      return;
    }
    setNome("");
    recarregar();
    toast.success("Equipe criada.");
  }

  async function salvarNome(id: string) {
    if (nomeEdicao.trim().length < 2) {
      toast.error("Informe um nome de equipe.");
      return;
    }
    const { error } = await supabase
      .from("equipes")
      .update({ nome: nomeEdicao.trim() })
      .eq("id", id);
    if (error) {
      toast.error("Não foi possível salvar.");
      return;
    }
    setEditandoId(null);
    recarregar();
    toast.success("Equipe atualizada.");
  }

  async function definirLider(id: string, valor: string) {
    const lider_id = valor === SEM_LIDER ? null : valor;
    const { error } = await supabase.from("equipes").update({ lider_id }).eq("id", id);
    if (error) {
      toast.error("Não foi possível definir o líder.");
      return;
    }
    recarregar();
    toast.success("Líder atualizado.");
  }

  if (sessao && !sessao.isAdmin) {
    return <p className="text-sm text-muted-foreground">Você não tem acesso a esta área.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Equipes</h1>
        <p className="text-sm text-muted-foreground">
          O líder indicado passa a ver, em modo leitura, as ideias das pessoas dessa equipe.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova equipe</CardTitle>
          <CardDescription>Depois de criar, indique o líder na lista abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={criar} className="flex flex-wrap items-end gap-3">
            <div className="min-w-60 flex-1 space-y-2">
              <Label htmlFor="nome-equipe">Nome</Label>
              <Input
                id="nome-equipe"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={80}
                placeholder="Ex.: Operações"
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
          <CardDescription>{equipes.length} equipe(s).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-64">Líder</TableHead>
                  <TableHead className="w-40 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipes.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell>
                      {editandoId === eq.id ? (
                        <Input
                          value={nomeEdicao}
                          onChange={(e) => setNomeEdicao(e.target.value)}
                          maxLength={80}
                        />
                      ) : (
                        eq.nome
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={eq.lider_id ?? SEM_LIDER}
                        onValueChange={(v) => definirLider(eq.id, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sem líder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SEM_LIDER}>Sem líder</SelectItem>
                          {pessoas.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome || p.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {editandoId === eq.id ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => salvarNome(eq.id)}>
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
                            setEditandoId(eq.id);
                            setNomeEdicao(eq.nome);
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
