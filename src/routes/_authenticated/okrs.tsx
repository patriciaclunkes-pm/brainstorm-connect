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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/okrs")({
  head: () => ({
    meta: [
      { title: "OKRs — Espaço Aberto" },
      { name: "description", content: "Cadastre e organize os OKRs associados às ideias do portal." },
      { property: "og:title", content: "OKRs — Espaço Aberto" },
      { property: "og:description", content: "Cadastro de OKRs associados às ideias do portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Okrs,
});

function Okrs() {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");

  const { data: okrs = [], isLoading } = useQuery({
    queryKey: ["okrs-todos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("okrs").select("id, nome, ativo, data_criacao").order("nome");
      if (error) throw error;
      return data;
    },
  });

  function recarregar() {
    queryClient.invalidateQueries({ queryKey: ["okrs-todos"] });
    queryClient.invalidateQueries({ queryKey: ["okrs-ativos"] });
    queryClient.invalidateQueries({ queryKey: ["okrs-edicao"] });
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 3) {
      toast.error("Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("okrs").insert({ nome: nome.trim() });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível criar o OKR. O nome já pode existir.");
      return;
    }
    setNome("");
    recarregar();
    toast.success("OKR criado.");
  }

  async function salvarNome(id: string) {
    if (nomeEdicao.trim().length < 3) {
      toast.error("Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    const { error } = await supabase.from("okrs").update({ nome: nomeEdicao.trim() }).eq("id", id);
    if (error) {
      toast.error("Não foi possível salvar.");
      return;
    }
    setEditandoId(null);
    recarregar();
    toast.success("OKR atualizado.");
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    const { error } = await supabase.from("okrs").update({ ativo }).eq("id", id);
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
        <h1 className="text-2xl font-semibold">OKRs</h1>
        <p className="text-sm text-muted-foreground">OKRs inativos deixam de aparecer em novas ideias, mas permanecem nos registros existentes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo OKR</CardTitle>
          <CardDescription>O nome precisa ser único.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={criar} className="flex flex-wrap items-end gap-3">
            <div className="min-w-60 flex-1 space-y-2">
              <Label htmlFor="nome-okr">Nome</Label>
              <Input id="nome-okr" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} placeholder="Ex.: Aumentar a eficiência operacional" />
            </div>
            <Button type="submit" disabled={salvando}>Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrados</CardTitle>
          <CardDescription>{okrs.length} OKR(s).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="w-32">Ativo</TableHead><TableHead className="w-40 text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {okrs.map((okr) => (
                  <TableRow key={okr.id}>
                    <TableCell>{editandoId === okr.id ? <Input value={nomeEdicao} onChange={(e) => setNomeEdicao(e.target.value)} maxLength={150} /> : okr.nome}</TableCell>
                    <TableCell><Switch checked={okr.ativo} onCheckedChange={(ativo) => alternarAtivo(okr.id, ativo)} aria-label={`Ativar OKR ${okr.nome}`} /></TableCell>
                    <TableCell className="text-right">
                      {editandoId === okr.id ? (
                        <div className="flex justify-end gap-2"><Button size="sm" onClick={() => salvarNome(okr.id)}>Salvar</Button><Button size="sm" variant="outline" onClick={() => setEditandoId(null)}>Cancelar</Button></div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setEditandoId(okr.id); setNomeEdicao(okr.nome); }}>Editar</Button>
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