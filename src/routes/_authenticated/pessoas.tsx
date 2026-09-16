import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
} from "@/lib/admin.functions";
import { ROLE_LABEL, type PerfilRole } from "@/lib/ideias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SEM_EQUIPE = "sem-equipe";
const ROLES: PerfilRole[] = ["admin", "rh", "lider", "colaborador"];

export const Route = createFileRoute("/_authenticated/pessoas")({
  head: () => ({
    meta: [
      { title: "Pessoas — Espaço Aberto" },
      {
        name: "description",
        content:
          "Crie contas, defina perfil de acesso e equipe das pessoas que usam o portal de ideias.",
      },
      { property: "og:title", content: "Pessoas — Espaço Aberto" },
      { property: "og:description", content: "Gestão de contas, perfis e equipes do portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pessoas,
});

type Edicao = {
  id: string;
  nome: string;
  role: PerfilRole;
  equipeId: string;
  ativo: boolean;
  novaSenha: string;
};

function Pessoas() {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const listar = useServerFn(listarUsuarios);
  const criar = useServerFn(criarUsuario);
  const atualizar = useServerFn(atualizarUsuario);
  const excluir = useServerFn(excluirUsuario);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<PerfilRole>("colaborador");
  const [equipeId, setEquipeId] = useState(SEM_EQUIPE);
  const [salvando, setSalvando] = useState(false);
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [excluindo, setExcluindo] = useState<{ id: string; nome: string } | null>(null);

  const { data: pessoas = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => listar(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipes").select("id, nome").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const nomeEquipe = (id: string | null) => equipes.find((e) => e.id === id)?.nome ?? "—";

  function recarregar() {
    queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  }

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 2) {
      toast.error("Informe o nome completo.");
      return;
    }
    if (senha.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setSalvando(true);
    try {
      await criar({
        data: {
          nome: nome.trim(),
          email: email.trim(),
          senha,
          role,
          equipeId: equipeId === SEM_EQUIPE ? null : equipeId,
        },
      });
      setNome("");
      setEmail("");
      setSenha("");
      setRole("colaborador");
      setEquipeId(SEM_EQUIPE);
      recarregar();
      toast.success("Conta criada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao() {
    if (!edicao) return;
    setSalvando(true);
    try {
      await atualizar({
        data: {
          id: edicao.id,
          nome: edicao.nome.trim(),
          role: edicao.role,
          equipeId: edicao.equipeId === SEM_EQUIPE ? null : edicao.equipeId,
          ativo: edicao.ativo,
          novaSenha: edicao.novaSenha.length >= 8 ? edicao.novaSenha : null,
        },
      });
      setEdicao(null);
      recarregar();
      toast.success("Cadastro atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    try {
      await excluir({ data: { id: excluindo.id } });
      setExcluindo(null);
      recarregar();
      toast.success("Conta excluída.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  if (sessao && !sessao.isGestor) {
    return <p className="text-sm text-muted-foreground">Você não tem acesso a esta área.</p>;
  }

  const podeEditar = sessao?.isAdmin === true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pessoas</h1>
        <p className="text-sm text-muted-foreground">
          As contas são criadas aqui pelo administrador. Não existe autocadastro no portal.
        </p>
      </div>

      {podeEditar && (
        <Card>
          <CardHeader>
            <CardTitle>Nova conta</CardTitle>
            <CardDescription>
              Informe uma senha inicial de pelo menos 8 caracteres e repasse à pessoa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={criarConta} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-nome">Nome completo</Label>
                <Input
                  id="p-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-email">E-mail</Label>
                <Input
                  id="p-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-senha">Senha inicial</Label>
                <Input
                  id="p-senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-perfil">Perfil</Label>
                <Select value={role} onValueChange={(v) => setRole(v as PerfilRole)}>
                  <SelectTrigger id="p-perfil">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-equipe">Equipe</Label>
                <Select value={equipeId} onValueChange={setEquipeId}>
                  <SelectTrigger id="p-equipe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_EQUIPE}>Sem equipe</SelectItem>
                    {equipes.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={salvando}>
                  Criar conta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cadastradas</CardTitle>
          <CardDescription>{pessoas.length} pessoa(s).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Situação</TableHead>
                  {podeEditar && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pessoas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell>{ROLE_LABEL[p.role as PerfilRole]}</TableCell>
                    <TableCell>{nomeEquipe(p.equipe_id)}</TableCell>
                    <TableCell>{p.ativo ? "Ativa" : "Desativada"}</TableCell>
                    {podeEditar && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEdicao({
                                id: p.id,
                                nome: p.nome,
                                role: p.role as PerfilRole,
                                equipeId: p.equipe_id ?? SEM_EQUIPE,
                                ativo: p.ativo,
                                novaSenha: "",
                              })
                            }
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={p.id === sessao?.userId}
                            onClick={() => setExcluindo({ id: p.id, nome: p.nome || p.email })}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!edicao} onOpenChange={(o) => !o && setEdicao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cadastro</DialogTitle>
            <DialogDescription>Deixe a senha em branco para mantê-la como está.</DialogDescription>
          </DialogHeader>
          {edicao && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="e-nome">Nome completo</Label>
                <Input
                  id="e-nome"
                  value={edicao.nome}
                  onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })}
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-perfil">Perfil</Label>
                <Select
                  value={edicao.role}
                  onValueChange={(v) => setEdicao({ ...edicao, role: v as PerfilRole })}
                >
                  <SelectTrigger id="e-perfil">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-equipe">Equipe</Label>
                <Select
                  value={edicao.equipeId}
                  onValueChange={(v) => setEdicao({ ...edicao, equipeId: v })}
                >
                  <SelectTrigger id="e-equipe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_EQUIPE}>Sem equipe</SelectItem>
                    {equipes.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-senha">Nova senha (opcional)</Label>
                <Input
                  id="e-senha"
                  type="password"
                  value={edicao.novaSenha}
                  onChange={(e) => setEdicao({ ...edicao, novaSenha: e.target.value })}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="e-ativo"
                  checked={edicao.ativo}
                  onCheckedChange={(v) => setEdicao({ ...edicao, ativo: v })}
                />
                <Label htmlFor="e-ativo">Conta ativa</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdicao(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao} disabled={salvando}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta</AlertDialogTitle>
            <AlertDialogDescription>
              A conta de {excluindo?.nome} será removida em definitivo. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
