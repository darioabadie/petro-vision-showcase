import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { newsletterIssues } from "@/lib/mock-data";
import { Mail, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/newsletter")({
  head: () => ({
    meta: [
      { title: "Newsletter · PetroData" },
      { name: "description", content: "Estado de Vaca Muerta: newsletter mensual con 4-5 visualizaciones y lectura breve." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Publicación mensual · gratuita"
        title="Estado de Vaca Muerta"
        description="Un mail al mes con 4-5 visualizaciones nuevas y una lectura de 3 minutos. Disparado a los días de cada actualización del Capítulo IV."
      />
      <div className="p-6 space-y-6">
        <div className="panel p-6 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold">1.842 suscriptores</div>
              <div className="text-sm text-muted-foreground">
                CEOs, analistas, prensa especializada y equipos de research
              </div>
            </div>
          </div>
          <form className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 sm:w-72 h-10 rounded-md border border-input bg-input/50 px-3 text-sm outline-none focus:border-primary/60"
            />
            <button
              type="button"
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Suscribirme
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-primary font-medium">Ediciones recientes</h2>
          <div className="panel divide-y divide-border">
            {newsletterIssues.map((issue) => (
              <a
                key={issue.n}
                href="#"
                className="p-5 flex items-start gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="w-16 shrink-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ed.</div>
                  <div className="num text-2xl font-semibold">#{issue.n}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{issue.date}</div>
                  <div className="text-base font-medium mt-1">{issue.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{issue.subs}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground mt-2" />
              </a>
            ))}
          </div>
        </div>

        <div className="panel p-5 border border-dashed border-primary/40">
          <div className="text-[11px] uppercase tracking-widest text-primary font-medium">Sponsor único</div>
          <div className="mt-1 text-sm">
            El newsletter admite un sponsor por edición. Alcance mensual: ~1.800 decisores del sector oil & gas argentino.
            <a href="#" className="text-primary hover:underline ml-1">Media kit →</a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
