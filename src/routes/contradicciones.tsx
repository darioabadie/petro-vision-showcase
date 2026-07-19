import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { proGuidanceDemo } from "@/lib/mock-data";
import { LineChart, TrendingDown, TrendingUp, Download } from "lucide-react";
import { GatedModule } from "@/components/gated-module";
import { ProActionButton, ProPill } from "@/components/pro-pill";
import { usePlan } from "@/lib/plan-context";

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
  const { isPro } = usePlan();
  const visible = isPro ? proGuidanceDemo : proGuidanceDemo.slice(0, 3);
  const hidden = proGuidanceDemo.slice(3);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Publicación trimestral · próximo cierre Q2 2026"
        title="Guidance tracker"
        description="Cruzamos el guidance público de cada operadora (earnings calls, hechos relevantes CNV, filings SEC) contra la producción y pozos conectados reportados al Capítulo IV. Tono de research, sin denuncia — casos positivos y negativos por igual."
        right={<ProActionButton icon={Download}>Exportar informe</ProActionButton>}
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
                muestra por igual sobre y sub-ejecución.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Mostrando {visible.length} de {proGuidanceDemo.length} operadoras cubiertas
            {!isPro && <> · <span className="text-primary">3 filas visibles en Free</span></>}
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ProPill /> Cobertura completa en el plan Pro
          </div>
        </div>

        <div className="grid gap-4">
          {visible.map((c) => (
            <GuidanceCard key={c.operator + c.metric} c={c} />
          ))}
        </div>

        {!isPro && hidden.length > 0 && (
          <GatedModule
            mode="peek"
            peekHeight={220}
            title={`${hidden.length} operadoras adicionales`}
            copy="La cobertura completa del guidance tracker está disponible en el plan Pro, junto con exports y alertas por desvío."
          >
            <div className="grid gap-4">
              {hidden.map((c) => (
                <GuidanceCard key={c.operator + c.metric} c={c} />
              ))}
            </div>
          </GatedModule>
        )}
      </div>
    </AppShell>
  );
}

function GuidanceCard({ c }: { c: (typeof proGuidanceDemo)[number] }) {
  const negative = c.delta < 0;
  return (
    <div className="panel p-5">
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
}
