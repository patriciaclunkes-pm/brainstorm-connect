import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  Lightbulb,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import heroImage from "@/assets/espaco-aberto-hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Espaço Aberto — Ideias que transformam" },
      {
        name: "description",
        content:
          "Conheça o Espaço Aberto, o canal oficial para compartilhar ideias, acompanhar retornos e construir melhorias na empresa.",
      },
      { property: "og:title", content: "Espaço Aberto — Ideias que transformam" },
      {
        property: "og:description",
        content: "Sua voz ajuda a construir um lugar melhor para todos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const recursos = [
  {
    icon: Lightbulb,
    title: "Compartilhe suas ideias",
    description: "Registre sugestões e melhorias para qualquer área da empresa.",
  },
  {
    icon: Eye,
    title: "Acompanhe tudo",
    description: "Veja o status e o histórico de cada contribuição pelo seu painel.",
  },
  {
    icon: MessageSquareText,
    title: "Receba o retorno",
    description: "O RH analisa e responde com clareza, sempre com a devida justificativa.",
  },
];

const beneficios = [
  "Sua ideia pode virar uma melhoria real na empresa",
  "Transparência total sobre cada contribuição",
  "Nenhuma ideia fica perdida: tudo é registrado",
  "Autoria reconhecida quando uma ideia é implementada",
];

const passos = [
  {
    number: "01",
    title: "Registre",
    description: "Preencha o título, a descrição e a categoria da sua ideia.",
  },
  {
    number: "02",
    title: "Acompanhe",
    description: "O RH avalia e você acompanha cada avanço pela linha do tempo.",
  },
  {
    number: "03",
    title: "Receba o retorno",
    description: "Veja se a ideia foi aprovada, entrou no roadmap ou recebeu uma justificativa.",
  },
];

function AccessButton({ variant = "default" }: { variant?: "default" | "secondary" }) {
  return (
    <Button asChild size="lg" variant={variant} className="min-h-11 px-6">
      <Link to="/login">
        Acessar o portal
        <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Espaço Aberto — início">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Lightbulb className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold">Espaço Aberto</span>
          </Link>
          <Button asChild size="sm">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative isolate flex min-h-[min(680px,calc(100svh-7rem))] items-center overflow-hidden">
          <img
            src={heroImage}
            alt="Equipe reunida colaborando em um ambiente de trabalho"
            className="absolute inset-0 -z-20 size-full object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-hero-overlay" aria-hidden="true" />
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="reveal max-w-2xl text-hero-foreground">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-hero-foreground/30 bg-hero-surface px-3 py-1.5 text-xs font-medium sm:text-sm">
                <Sparkles className="size-4 text-success" aria-hidden="true" />
                Canal oficial de feedback da empresa
              </div>
              <h1 className="text-5xl leading-tight font-semibold sm:text-6xl lg:text-7xl">
                Espaço Aberto
              </h1>
              <p className="mt-5 max-w-xl text-xl leading-snug font-medium sm:text-2xl">
                Seu canal para transformar ideias em melhorias reais
              </p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-hero-muted sm:text-lg">
                Compartilhe suas ideias, acompanhe o retorno e ajude a construir um lugar melhor para
                todos.
              </p>
              <div className="mt-8">
                <AccessButton />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-success">O QUE É</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Um espaço para toda voz ser ouvida</h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                O Espaço Aberto é o canal oficial da empresa para você compartilhar ideias, sugestões e
                melhorias. Aqui, sua voz é ouvida e cada contribuição recebe um retorno.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {recursos.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <span className="flex size-11 items-center justify-center rounded-md bg-accent text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-success">POR QUE PARTICIPAR</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Boas ideias merecem espaço para crescer</h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {beneficios.map((beneficio) => (
                <li key={beneficio} className="flex gap-3 text-sm leading-relaxed sm:text-base">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-success">COMO FUNCIONA</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Da ideia ao retorno, sem perder nenhum passo</h2>
            </div>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {passos.map((passo) => (
                <li key={passo.number} className="relative border-t border-border pt-6">
                  <span className="font-display text-3xl font-semibold text-success">{passo.number}</span>
                  <h3 className="mt-4 text-xl font-semibold">{passo.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{passo.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-primary py-16 text-primary-foreground sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Check className="mx-auto size-7 text-success" aria-hidden="true" />
            <blockquote className="mt-5 font-display text-3xl leading-snug font-semibold sm:text-4xl">
              “Toda ideia importa. Todo retorno é transparente.”
            </blockquote>
          </div>
        </section>

        <section className="py-20 text-center sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold sm:text-4xl">Pronto para fazer sua voz ser ouvida?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Entre no portal e compartilhe a próxima melhoria que pode transformar nossa empresa.
            </p>
            <div className="mt-8 flex justify-center">
              <AccessButton />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Lightbulb className="size-4 text-primary" aria-hidden="true" /> Espaço Aberto
          </span>
          <span>© 2026 Espaço Aberto — Canal de feedback corporativo</span>
        </div>
      </footer>
    </div>
  );
}