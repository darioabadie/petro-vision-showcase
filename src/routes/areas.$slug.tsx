import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell, PageHeader, Stat } from "@/components/app-shell";
import { areas, events, declineByCohort } from "@/lib/mock-data";
import {
  Bar,
  BarChart,
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

  const monthly = Array.from({ length: 12 }, (_, i) => ({
    m: `M${i + 1}`,
    wells: 3 + Math.round(Math.sin(i / 2) * 3 + i * 0.6),
  }));

  const areaEvents = events.filter((e) => e.entitySlug === area.slug);

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
          <Stat label="Producción oil" value={area.productionOilKbbld.toFixed(1)} unit="kbbl/d" delta="+2.4% MoM" />
          <Stat label="Producción gas" value={area.productionGasMMm3d.toFixed(1)} unit="MMm³/d" delta="+0.9% MoM" />
          <Stat label="Pozos activos" value={area.wellsActive.toString()} hint={`Operador: ${area.operator}`} />
          <Stat label="Concesión hasta" value={area.concessionUntil} hint="Prorrogable" />
        </div>

        {area.avgStages > 0 && (
          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                Adjunto IV
              </div>
              <h2 className="text-lg font-display font-semibold mt-1">Completación promedio</h2>
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
                Altas de pozos
              </div>
              <h2 className="text-lg font-display font-semibold mt-1">Nuevos pozos por mes (2025)</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={monthly} margin={{ left: -10, right: 12 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="m" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 12 }}
                  />
                  <Bar dataKey="wells" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                Curva tipo
              </div>
              <h2 className="text-lg font-display font-semibold mt-1">Declinación por cohorte</h2>
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

        {areaEvents.length > 0 && (
          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">Timeline</div>
              <h2 className="text-lg font-display font-semibold mt-1">Eventos del área</h2>
            </div>
            <ul className="divide-y divide-border">
              {areaEvents.map((e) => (
                <li key={e.date + e.title} className="py-3 flex gap-3 items-start">
                  <div className="w-24 shrink-0 text-xs num text-muted-foreground pt-0.5">{e.date}</div>
                  <div className="flex-1">
                    <div className="text-sm">{e.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {e.category} · Fuente: {e.source}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
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
