import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { contradictions } from "@/lib/mock-data";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/contradicciones")({
  head: () => ({
    meta: [
      { title: "Contradicciones · PetroData" },
      { name: "description", content: "Cruce sistemático guidance anunciado vs. ejecutado por operadora. Publicación trimestral." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Informe Q3 2025 · publicación trimestral"
        title="Anunciado vs. ejecutado"
        description="Cruzamos el guidance público de cada operadora (earnings calls, hechos relevantes CNV, filings SEC) contra la producción y pozos conectados reportados al Capítulo IV."
      />
      <div className="p-6 space-y-6">
        <div className="panel p-5 border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Metodología</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
                Todas las cifras "anunciado" provienen de fuentes públicas citadas explícitamente. "Ejecutado"
                corresponde al dato publicado en el Capítulo IV / Adjunto IV con fecha de corte 2025-10.
                Delta = (ejecutado − anunciado) / anunciado. Cobertura: top 10 operadoras.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {contradictions.map((c) => {
            const negative = c.delta < 0;
            return (
              <div key={c.operator + c.metric} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link to="/operadoras/$slug" params={{ slug: c.operatorSlug }} className="text-lg font-display font-semibold hover:text-primary">
                      {c.operator}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.metric} · {c.period}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 text-2xl num font-semibold ${negative ? "text-destructive" : "text-primary"}`}>
                    {negative ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                    {c.delta > 0 ? "+" : ""}{c.delta}%
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Anunciado</div>
                    <div className="num text-xl mt-1">{c.announced}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ejecutado (Cap. IV)</div>
                    <div className="num text-xl mt-1">{c.actual}</div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{c.narrative}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
