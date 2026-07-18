import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { events } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos · PetroData" },
      { name: "description", content: "Timeline curado: concesiones, farm-ins, M&A, sanciones, guidance y regulatorio del oil & gas argentino." },
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
        eyebrow="Ingesta diaria · boletines + prensa"
        title="Timeline de eventos"
        description="Extracción automatizada de Boletines Oficiales, CNV, SEC y prensa especializada, con curaduría humana. Cada evento cita su fuente."
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
      </div>
    </AppShell>
  );
}
