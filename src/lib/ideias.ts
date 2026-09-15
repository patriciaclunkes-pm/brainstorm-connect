export type IdeiaStatus =
  | "aguardando_avaliacao"
  | "em_avaliacao"
  | "aguardando_informacoes"
  | "aprovada"
  | "em_roadmap"
  | "recusada"
  | "implementada";

export const STATUS_LABEL: Record<IdeiaStatus, string> = {
  aguardando_avaliacao: "Aguardando avaliação",
  em_avaliacao: "Em avaliação",
  aguardando_informacoes: "Aguardando informações",
  aprovada: "Aprovada",
  em_roadmap: "Em roadmap",
  recusada: "Recusada",
  implementada: "Implementada",
};

export const STATUS_ORDER: IdeiaStatus[] = [
  "aguardando_avaliacao",
  "em_avaliacao",
  "aguardando_informacoes",
  "aprovada",
  "em_roadmap",
  "recusada",
  "implementada",
];

export const TRANSICOES: Record<IdeiaStatus, IdeiaStatus[]> = {
  aguardando_avaliacao: ["em_avaliacao"],
  em_avaliacao: ["aguardando_informacoes", "aprovada", "em_roadmap", "recusada"],
  aguardando_informacoes: ["em_avaliacao", "recusada"],
  aprovada: ["implementada", "em_roadmap"],
  em_roadmap: ["aprovada", "em_avaliacao"],
  recusada: [],
  implementada: [],
};

export const STATUS_CLASSES: Record<IdeiaStatus, string> = {
  aguardando_avaliacao: "bg-muted text-muted-foreground border-border",
  em_avaliacao: "bg-info/15 text-info border-info/30",
  aguardando_informacoes: "bg-warning/15 text-warning border-warning/30",
  aprovada: "bg-success/15 text-success border-success/30",
  em_roadmap: "bg-accent text-accent-foreground border-border",
  recusada: "bg-destructive/15 text-destructive border-destructive/30",
  implementada: "bg-primary/15 text-primary border-primary/30",
};

export type PerfilRole = "admin" | "rh" | "lider" | "colaborador";

export const ROLE_LABEL: Record<PerfilRole, string> = {
  admin: "Administrador",
  rh: "Usuário RH",
  lider: "Líder de equipe",
  colaborador: "Colaborador",
};

export function formatarData(valor: string | null | undefined) {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
