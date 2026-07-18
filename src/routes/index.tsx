import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader, Stat } from "@/components/app-shell";
import {
  productionSeries,
  operators,
  events,
  declineByCohort,
  contradictions,
  CUTOFF,
  kpis,
  ARENA_PRELIMINAR,
  cohort2025Peak,
  cohort2026Peak,
} from "@/lib/mock-data";
import { ArrowUpRight, Download, TrendingUp, Mail, Info, CalendarClock, LineChart as LineChartIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PetroData · Overview — Estado de Vaca Muerta" },
      {
        name: "description",
        content:
          "Dashboard mensual: producción no convencional, ranking de operadoras, curvas de declinación por cohorte, últimos eventos y contradicciones.",
      },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const last = productionSeries[productionSeries.length - 1];
  const prev = productionSeries[productionSeries.length - 2];
  const yoy = productionSeries[productionSeries.length - 13];
  const deltaOilMoM = (((last.oil - prev.oil) / prev.oil) * 100).toFixed(1);
  const deltaOilYoY = (((last.oil - yoy.oil) / yoy.oil) * 100).toFixed(1);

  const ranking = [...operators]
    .sort((a, b) => b.productionOilKbbld - a.productionOilKbbld)
    .slice(0, 8)
    .map((o) => ({ name: o.name, prod: o.productionOilKbbld, slug: o.slug }));

  return (
    <AppShell>
      <PageHeader
        eyebrow={CUTOFF}
        title="Estado de Vaca Muerta"
        description="Overview mensual generado desde Capítulo IV. Todas las métricas son server-side sobre el datastore público. Última corrida del pipeline: hace 6 horas."
        right={
          <div className="flex gap-2">
            <button className="h-9 px-3 rounded-md border border-border text-sm inline-flex items-center gap-1.5 hover:bg-muted">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <Link
              to="/newsletter"
              className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center gap-1.5 hover:opacity-90"
            >
              Newsletter <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Producción oil NC"
            value={last.oil.toString()}
            unit="kbbl/d"
            delta={`+${deltaOilMoM}% MoM`}
            hint={`YoY +${deltaOilYoY}%`}
          />
          <Stat
            label="Producción gas NC"
            value={last.gas.toString()}
            unit="MMm³/d"
            delta="+0.8% MoM"
            hint="Plan Gas.Ar activo"
          />
          <Stat
            label="Pozos conectados 2025"
            value="1.284"
            delta="+18% YoY"
            hint="vs. 1.088 acum. 2024"
          />
          <Stat
            label="Arena bombeada (Oct)"
            value="284k"
            unit="tn"
            delta="+11.4% MoM"
            hint="Intensidad récord"
          />
        </div>

        {/* Production chart */}
        <div className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                Serie mensual
              </div>
              <h2 className="text-lg font-display font-semibold mt-1">
                Producción no convencional nacional
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 24 meses · fuente: Cap. IV Sec. Energía
              </p>
            </div>
            <div className="flex gap-4 text-xs">
              <LegendDot color="var(--color-chart-1)" label="Oil (kbbl/d)" />
              <LegendDot color="var(--color-chart-2)" label="Gas (MMm³/d)" />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={productionSeries} margin={{ left: -10, right: 12, top: 8 }}>
                <defs>
                  <linearGradient id="oil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                  interval={2}
                />
                <YAxis
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="oil"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#oil)"
                />
                <Area
                  type="monotone"
                  dataKey="gas"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  fill="url(#gas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row: ranking + decline */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="panel p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                  Ranking Oct 2025
                </div>
                <h2 className="text-lg font-display font-semibold mt-1">
                  Producción oil por operadora
                </h2>
              </div>
              <Link to="/operadoras" className="text-xs text-primary hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart
                  data={ranking}
                  layout="vertical"
                  margin={{ left: 20, right: 30 }}
                >
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: "var(--color-foreground)", fontSize: 12 }}
                    width={110}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip unit="kbbl/d" />} />
                  <Bar dataKey="prod" radius={[0, 4, 4, 0]}>
                    {ranking.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? "var(--color-primary)" : "var(--color-chart-2)"}
                        opacity={i === 0 ? 1 : 0.6 + 0.05 * (ranking.length - i)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                  Análisis por cohorte
                </div>
                <h2 className="text-lg font-display font-semibold mt-1">
                  Curva de declinación por año de puesta en marcha
                </h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" /> Cohorte 2025 rinde ~12% más que 2024
                </p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={declineByCohort} margin={{ left: -10, right: 12, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    label={{ value: "Meses desde IP", position: "insideBottom", offset: -2, fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <Tooltip content={<ChartTooltip unit="bbl/d" />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} />
                  <Line type="monotone" dataKey="2022" stroke="var(--color-chart-4)" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="2023" stroke="var(--color-chart-3)" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="2024" stroke="var(--color-chart-2)" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="2025" stroke="var(--color-primary)" dot={false} strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Events + contradictions */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="panel p-5 lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                  Timeline
                </div>
                <h2 className="text-lg font-display font-semibold mt-1">Últimos eventos</h2>
              </div>
              <Link to="/eventos" className="text-xs text-primary hover:underline">Ver todos →</Link>
            </div>
            <ul className="divide-y divide-border">
              {events.slice(0, 6).map((e) => (
                <li key={e.date + e.title} className="py-3 flex gap-3 items-start">
                  <div className="w-24 shrink-0 text-xs num text-muted-foreground pt-0.5">
                    {e.date}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                        {e.category}
                      </span>
                      {e.entitySlug && (
                        <Link
                          to={e.entityType === "operator" ? "/operadoras/$slug" : "/areas/$slug"}
                          params={{ slug: e.entitySlug }}
                          className="text-xs text-primary hover:underline"
                        >
                          {e.entity}
                        </Link>
                      )}
                      {!e.entitySlug && (
                        <span className="text-xs text-muted-foreground">{e.entity}</span>
                      )}
                    </div>
                    <div className="text-sm mt-1">{e.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Fuente: {e.source}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                  Anunciado vs. ejecutado
                </div>
                <h2 className="text-lg font-display font-semibold mt-1">Contradicciones</h2>
              </div>
              <Link to="/contradicciones" className="text-xs text-primary hover:underline">
                Ver →
              </Link>
            </div>
            <ul className="space-y-3">
              {contradictions.slice(0, 4).map((c) => (
                <li key={c.operator + c.metric} className="border border-border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <Link
                      to="/operadoras/$slug"
                      params={{ slug: c.operatorSlug }}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {c.operator}
                    </Link>
                    <span
                      className={`num text-xs ${c.delta < 0 ? "text-destructive" : "text-primary"}`}
                    >
                      {c.delta > 0 ? "+" : ""}
                      {c.delta}%
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {c.metric} · {c.period}
                  </div>
                  <div className="text-xs mt-1.5 flex justify-between">
                    <span className="text-muted-foreground">Anunciado</span>
                    <span className="num">{c.announced}</span>
                  </div>
                  <div className="text-xs flex justify-between">
                    <span className="text-muted-foreground">Ejecutado</span>
                    <span className="num">{c.actual}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="panel p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-display font-semibold text-lg">
                ¿Necesitás export CSV, API o alertas por operadora?
              </div>
              <div className="text-sm text-muted-foreground">
                PetroData Pro — desde US$100/mes por asiento. Enterprise disponible.
              </div>
            </div>
          </div>
          <Link
            to="/pro"
            className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90"
          >
            Ver planes <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
      <div className="text-muted-foreground mb-1 font-mono">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground">{p.dataKey}</span>
          <span className="num ml-auto text-foreground font-medium">
            {p.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
