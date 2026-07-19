import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell, PageHeader, Stat, HelpTooltip } from "@/components/app-shell";
import { areas, declineByCohort } from "@/lib/mock-data";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/areas/$slug")({
  loader: ({ params }) => {
    const area = areas.find((a) => a.slug === params.slug);
    if (!area) throw notFound();
    return { area };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.area.name} · PetroData` : "Área · PetroData" },
    ],
  }),
  component: AreaDetail,
});

function AreaDetail() {
  const { area } = Route.useLoaderData();
  const series = (area.serie ?? []).slice(-48);

  return (
    <AppShell>
      <PageHeader
        eyebrow={
          <Link to="/areas" className="hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Áreas
          </Link> as any
        }
        title={area.name}
        description={`${area.type} operado por ${area.operator} en la cuenca ${area.basin}. Concesión vigente hasta ${area.concessionUntil}.`}
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Producción oil"
            value={area.productionOilKbbld.toFixed(1)}
            unit="kbbl/d"
            hint={`Corte: ${area.serie?.slice(-1)[0]?.month ?? "—"}`}
            tooltip="Producción de petróleo del área en el último mes completo. Suma de todos los pozos reportados al Capítulo IV."
          />
          <Stat
            label="Producción gas"
            value={area.productionGasMMm3d.toFixed(1)}
            unit="MMm³/d"
            tooltip="Producción de gas del área en el último mes completo en millones de m³/día."
          />
          <Stat
            label="Pozos activos"
            value={area.wellsActive.toString()}
            hint={`Operador: ${area.operator}`}
            tooltip="Pozos del área que reportaron volumen > 0 en el último mes del Capítulo IV."
          />
          <Stat
            label="Concesión hasta"
            value={area.concessionUntil}
            hint="Prorrogable"
            tooltip="Año de vencimiento de la concesión de explotación. Las prórrogas bajo RIGI pueden extender este plazo."
          />
        </div>

        {area.avgStages > 0 && (
          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                Adjunto IV
              </div>
              <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
                Completación promedio
                <HelpTooltip text="Etapas, arena y rama lateral promedio de los pozos fracturados en el área, según el Adjunto IV." />
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <BigMetric label="Etapas de fractura" value={area.avgStages.toString()} hint="Promedio por pozo horizontal" />
              <BigMetric label="Arena bombeada" value={area.avgProppantTn.toLocaleString()} unit="tn" hint="Por pozo" />
              <BigMetric label="Rama lateral" value={area.avgLateralM.toLocaleString()} unit="m" hint="Longitud promedio" />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                Serie histórica
              </div>
              <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
                Producción del área
                <HelpTooltip text="Evolución mensual de la producción del área. La forma de la curva revela la fase del bloque: rampa, plateau o declinación." />
              </h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={series} margin={{ left: -10, right: 12 }}>
                  <defs>
                    <linearGradient id="areaOil" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 12 }} />
                  <Area type="monotone" dataKey="oil" stroke="var(--color-primary)" strokeWidth={2} fill="url(#areaOil)" name="Oil (kbbl/d)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>


          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                Curva tipo
              </div>
              <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
                Declinación por cohorte
                <HelpTooltip text="Curvas de declinación nacionales como referencia. Las cohortes por área están en el roadmap para bloques con >30 pozos por cohorte." />
              </h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={declineByCohort} margin={{ left: -10, right: 12 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 12 }} />
                  <Line type="monotone" dataKey="2024" stroke="var(--color-chart-2)" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="2025" stroke="var(--color-primary)" dot={false} strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function BigMetric({ label, value, unit, hint }: { label: string; value: string; unit?: string; hint?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="num text-3xl font-semibold">{value}</div>
        {unit && <div className="text-sm text-muted-foreground">{unit}</div>}
      </div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
