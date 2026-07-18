import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pro")({
  head: () => ({
    meta: [
      { title: "PetroData Pro · Planes" },
      { name: "description", content: "Alertas, exports, API y reportes trimestrales para equipos que necesitan inteligencia sobre Vaca Muerta." },
    ],
  }),
  component: Page,
});

const plans = [
  {
    name: "Free",
    price: "US$0",
    period: "para siempre",
    tagline: "Observatorio público",
    features: [
      "Overview mensual",
      "Fichas de operadoras y áreas",
      "Timeline de eventos",
      "Newsletter mensual",
      "Glosario",
    ],
    cta: "Ya lo estás usando",
    highlight: false,
  },
  {
    name: "Pro",
    price: "US$120",
    period: "/asiento/mes",
    tagline: "Analistas y equipos de research",
    features: [
      "Todo lo anterior +",
      "Alertas por operadora/área",
      "Exports CSV ilimitados",
      "Curvas de declinación por cohorte",
      "Benchmarking Adjunto IV",
      "Reportes trimestrales completos",
      "Acceso al histórico completo",
    ],
    cta: "Solicitar acceso",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "desde US$2.000/mes",
    tagline: "Consultoras y operadoras",
    features: [
      "Todo lo de Pro +",
      "API programática",
      "Series limpias + capa de eventos",
      "SSO y usuarios ilimitados",
      "Onboarding dedicado",
      "SLA y soporte prioritario",
    ],
    cta: "Hablar con ventas",
    highlight: false,
  },
];

function Page() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Pricing · Etapa 3"
        title="PetroData Pro"
        description="El observatorio es gratis. Pro y Enterprise agregan las herramientas que un analista o consultora necesita para trabajar todos los días con estos datos."
      />
      <div className="p-6 space-y-8">
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`panel p-6 relative ${p.highlight ? "border-primary/60" : ""}`}
              style={p.highlight ? { boxShadow: "var(--shadow-glow), var(--shadow-panel)" } : undefined}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-6 text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-primary text-primary-foreground font-semibold inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Recomendado
                </div>
              )}
              <div className="text-sm text-muted-foreground">{p.tagline}</div>
              <div className="mt-1 text-2xl font-display font-semibold">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="num text-4xl font-semibold">{p.price}</span>
                <span className="text-xs text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="text-sm flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 w-full h-10 rounded-md text-sm font-medium ${
                  p.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border hover:bg-muted"
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="panel p-6">
          <h2 className="font-display text-xl font-semibold">Preguntas frecuentes</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-x-8 gap-y-5">
            {[
              ["¿De dónde salen los datos?", "Del datastore público de la Secretaría de Energía (Capítulo IV, Adjunto IV, permisos y concesiones), boletines oficiales de Nación, Neuquén y Río Negro, más filings CNV y SEC."],
              ["¿Cada cuánto se actualiza?", "Producción y completación se actualizan mensualmente al publicarse el Capítulo IV. Eventos y contradicciones se actualizan continuamente."],
              ["¿Sirve para consultoras?", "Sí — el plan Enterprise incluye API y series limpias listas para incorporar en informes propios."],
              ["¿Hay prueba gratis de Pro?", "14 días de trial completo, sin tarjeta."],
            ].map(([q, a]) => (
              <div key={q}>
                <div className="font-medium">{q}</div>
                <div className="text-sm text-muted-foreground mt-1">{a}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          ¿Sos periodista o investigador académico? <Link to="/newsletter" className="text-primary hover:underline">Acceso Pro gratuito bajo pedido.</Link>
        </div>
      </div>
    </AppShell>
  );
}
