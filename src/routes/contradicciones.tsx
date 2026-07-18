import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { contradictions } from "@/lib/mock-data";
import { LineChart, TrendingDown, TrendingUp, Mail } from "lucide-react";

export const Route = createFileRoute("/contradicciones")({
  head: () => ({
    meta: [
      { title: "Guidance tracker · PetroData" },
      { name: "description", content: "Cruce sistemático guidance anunciado vs. ejecutado por operadora en Vaca Muerta. Publicación trimestral basada en Capítulo IV." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Publicación trimestral · próximo cierre Q2 2026"
        title="Guidance tracker"
        description="Cruzamos el guidance público de cada operadora (earnings calls, hechos relevantes CNV, filings SEC) contra la producción y pozos conectados reportados al Capítulo IV. Tono de research, sin denuncia — casos positivos y negativos por igual."
      />
      <div className="p-6 space-y-6">
        <div className="panel p-6 border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <LineChart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">Metodología (research grade)</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                Todas las cifras "anunciado" provienen de fuentes públicas citadas
                explícitamente (earnings call, filing, comunicado). "Ejecutado"
                corresponde al dato publicado en el Capítulo IV / Adjunto IV con
                fecha de corte oficial. Δ = (ejecutado − anunciado) / anunciado.
                Cobertura inicial: top 10 operadoras por producción. El tracker
                mostrará por igual sobre y sub-ejecución.
              </p>
            </div>
          </div>
        </div>

        {contradictions.length === 0 ? (
          <div className="panel p-10 flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-md bg-primary/10 border border-primary/30 grid place-items-center">
              <LineChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold">Sin publicaciones aún</div>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                La capa editorial del tracker está en construcción. Los KPIs y
                series de la plataforma ya usan datos oficiales al corte 2026-05.
                El primer informe trimestral se emite con el cierre de Q2 2026.
              </p>
            </div>
            <Link
              to="/newsletter"
              className="mt-2 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90"
            >
              <Mail className="h-4 w-4" /> Avisarme por email
            </Link>
          </div>
        ) : (
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
        )}
      </div>
    </AppShell>
  );
}
