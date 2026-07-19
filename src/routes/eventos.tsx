import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { events } from "@/lib/mock-data";
import { useState } from "react";
import { CalendarClock, Mail } from "lucide-react";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos · PetroData" },
      { name: "description", content: "Timeline de eventos corporativos del oil & gas argentino — en el roadmap de PetroData." },
    ],
  }),
  component: EventsPage,
});

const categories = ["Todos", "Concesión", "Farm-in", "M&A", "Sanción", "Guidance", "Regulatorio"] as const;
const catColor: Record<string, string> = {
  "Concesión": "bg-chart-2/15 text-chart-2 border-chart-2/30",
  "Farm-in": "bg-chart-3/15 text-chart-3 border-chart-3/30",
  "M&A": "bg-primary/15 text-primary border-primary/30",
  "Sanción": "bg-destructive/15 text-destructive border-destructive/30",
  "Guidance": "bg-chart-4/15 text-chart-4 border-chart-4/30",
  "Regulatorio": "bg-muted text-muted-foreground border-border",
};

function EventsPage() {
  const [filter, setFilter] = useState<(typeof categories)[number]>("Todos");
  const filtered = filter === "Todos" ? events : events.filter((e) => e.category === filter);

  return (
    <AppShell>
      <PageHeader
        eyebrow="En el roadmap · sin fecha"
        title="Timeline de eventos"
        description="El timeline de concesiones, farm-ins, M&A y regulatorio requiere ingesta de fuentes textuales (Boletines Oficiales, CNV, SEC, prensa). Está en el roadmap pero no tiene fecha de lanzamiento."
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 h-8 rounded-md border text-xs transition-colors ${
                filter === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="panel p-10 flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-md bg-muted border border-border grid place-items-center">
              <CalendarClock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold">En el roadmap</div>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                La plataforma actual es 100% numérica: Capítulo IV y Adjunto IV de la
                Secretaría de Energía. La capa de eventos corporativos (concesiones,
                farm-ins, M&A, regulatorio) depende de ingesta de fuentes textuales
                y está planificada para una fase posterior, sin fecha definida.
              </p>
            </div>
            <Link
              to="/newsletter"
              className="mt-2 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90"
            >
              <Mail className="h-4 w-4" /> Seguir novedades por newsletter
            </Link>
          </div>
        ) : (
          <div className="panel divide-y divide-border">
            {filtered.map((e) => (
              <div key={e.date + e.title} className="p-5 flex flex-wrap gap-4 items-start hover:bg-muted/20">
                <div className="w-28 shrink-0">
                  <div className="text-xs num text-muted-foreground">{e.date}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-1 text-muted-foreground">
                    {e.sourceType}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${catColor[e.category]}`}>
                      {e.category}
                    </span>
                    {e.entitySlug ? (
                      <Link
                        to={e.entityType === "operator" ? "/operadoras/$slug" : "/areas/$slug"}
                        params={{ slug: e.entitySlug }}
                        className="text-xs text-primary hover:underline"
                      >
                        {e.entity}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">{e.entity}</span>
                    )}
                  </div>
                  <div className="text-sm">{e.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Fuente: {e.source}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
