import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { areas } from "@/lib/mock-data";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/areas/")({
  head: () => ({
    meta: [
      { title: "Áreas · PetroData" },
      { name: "description", content: "Áreas de Vaca Muerta y cuencas argentinas: producción, intensidad de fractura, longitud lateral y concesiones." },
    ],
  }),
  component: AreasList,
});

const typeColor: Record<string, string> = {
  "Shale Oil": "text-primary border-primary/40",
  "Shale Gas": "text-chart-2 border-chart-2/40",
  "Tight Gas": "text-chart-3 border-chart-3/40",
  "Convencional": "text-muted-foreground border-border",
};

function AreasList() {
  const sorted = [...areas].sort((a, b) => b.productionOilKbbld - a.productionOilKbbld);
  return (
    <AppShell>
      <PageHeader
        eyebrow={`${areas.length} áreas activas`}
        title="Áreas y bloques"
        description="Fichas con Capítulo IV + Adjunto IV: producción por área, número de etapas, arena bombeada, longitud de rama lateral y vencimiento de concesión."
      />
      <div className="p-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((a) => (
          <Link
            key={a.slug}
            to="/areas/$slug"
            params={{ slug: a.slug }}
            className="panel p-5 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Cuenca {a.basin}
                </div>
                <h3 className="text-lg font-display font-semibold mt-1 group-hover:text-primary">
                  {a.name}
                </h3>
                <div className="text-xs text-muted-foreground mt-0.5">Operador: {a.operator}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${typeColor[a.type]}`}>
                {a.type}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
              <Metric label="Oil" value={a.productionOilKbbld.toFixed(1)} unit="kbbl/d" />
              <Metric label="Gas" value={a.productionGasMMm3d.toFixed(1)} unit="MMm³/d" />
              <Metric label="Pozos" value={a.wellsActive.toString()} />
            </div>
            {a.avgStages > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                <Metric label="Etapas prom." value={a.avgStages.toString()} small />
                <Metric label="Arena prom." value={a.avgProppantTn.toString()} unit="tn" small />
                <Metric label="Lateral" value={a.avgLateralM.toString()} unit="m" small />
              </div>
            )}
            <div className="mt-3 text-[11px] text-muted-foreground">
              Concesión vigente hasta <span className="num text-foreground">{a.concessionUntil}</span>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

function Metric({ label, value, unit, small }: { label: string; value: string; unit?: string; small?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`num font-semibold ${small ? "text-sm" : "text-base"}`}>
        {value}
        {unit && <span className="text-[10px] text-muted-foreground ml-1">{unit}</span>}
      </div>
    </div>
  );
}
