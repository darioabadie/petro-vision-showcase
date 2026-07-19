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
import { ProActionButton, ProPill } from "@/components/pro-pill";
import { usePlan } from "@/lib/plan-context";
import {
  productionSeries,
  operators,
  declineByCohort,
  ducsDemo,
  CUTOFF,
  kpis,
  ARENA_PRELIMINAR,
  cohort2025Peak,
  cohort2026Peak,
} from "@/lib/mock-data";
import { ArrowUpRight, Download, TrendingUp, Mail, Info, History, Drill } from "lucide-react";

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
            <ProActionButton icon={Download}>Exportar CSV</ProActionButton>
            <ProActionButton icon={History}>Histórico completo</ProActionButton>
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
        {/* Stats — fila 1: producción y actividad */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Producción oil (VM)"
            value={kpis.oil_kbbld.toFixed(1)}
            unit="kbbl/d"
            delta={`${kpis.oil_mom_pct >= 0 ? "+" : ""}${kpis.oil_mom_pct}% MoM`}
            hint={`YoY +${kpis.oil_yoy_pct}%`}
          />
          <Stat
            label="Producción gas (VM)"
            value={kpis.gas_mmm3d.toFixed(1)}
            unit="MMm³/d"
            delta={`${kpis.gas_mom_pct >= 0 ? "+" : ""}${kpis.gas_mom_pct}% MoM`}
            hint={`YoY +${kpis.gas_yoy_pct}%`}
          />
          <Stat
            label="Pozos conectados YTD"
            value={kpis.pozos_conectados_ytd.toString()}
            delta={`+${kpis.pozos_ytd_yoy_pct}% YoY`}
            hint={`vs. ${kpis.pozos_conectados_ytd_prev} en mismo período 2025`}
          />
          <Stat
            label={`Arena bombeada (${kpis.arena_mes})`}
            value={`${Math.round(kpis.arena_tn / 1000)}k`}
            unit="tn"
            delta={ARENA_PRELIMINAR ? "Dato preliminar" : `${kpis.arena_mom_pct >= 0 ? "+" : ""}${kpis.arena_mom_pct}% MoM`}
            hint="Rezago de carga Adjunto IV"
          />
        </div>
        {/* Stats — fila 2: completación (Adjunto IV) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Etapas prom. por pozo"
            value={kpis.etapas_promedio.toFixed(1)}
            unit="etapas"
            hint="Adjunto IV · promedio nacional"
          />
          <Stat
            label="Rama lateral prom."
            value={kpis.rama_promedio_m.toLocaleString()}
            unit="m"
            hint="Longitud horizontal"
          />
          <Stat
            label="Arena importada"
            value={kpis.arena_pct_importada === 0 ? "0%" : `${kpis.arena_pct_importada}%`}
            hint={kpis.arena_pct_importada === 0 ? "100% arena nacional" : "del total bombeado"}
          />
          <Stat
            label="Ratio completación"
            value={kpis.pozos_conectados_ytd > 0 ? (Math.round(kpis.arena_tn / kpis.pozos_conectados_ytd / 5)).toLocaleString() : "—"}
            unit="tn/pozo"
            hint="Arena por pozo · estimado mensual"
          />
        </div>
        {ARENA_PRELIMINAR && (
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground border border-border/60 rounded-md px-3 py-2 bg-muted/20">
            <Info className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            El pico de arena de {kpis.arena_mes} refleja rezago de carga del Adjunto IV
            (abril subreportado). Recomendamos leerlo con 1 mes de rezago.
          </div>
        )}

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
                  Ranking {kpis.corte}
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
                  <TrendingUp className="h-3 w-3 text-primary" /> Cohorte 2026 pica ~{Math.round(cohort2026Peak)} bbl/d — {Math.round(((cohort2026Peak - cohort2025Peak) / cohort2025Peak) * 100)}% arriba de la 2025
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
                    label={{ value: "Meses desde IP oil", position: "insideBottom", offset: -2, fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <Tooltip content={<ChartTooltip unit="bbl/d" />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} />
                  <Line type="monotone" dataKey="2022" stroke="var(--color-chart-4)" dot={false} strokeWidth={1} strokeOpacity={0.6} />
                  <Line type="monotone" dataKey="2023" stroke="var(--color-chart-3)" dot={false} strokeWidth={1.2} />
                  <Line type="monotone" dataKey="2024" stroke="var(--color-chart-2)" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="2025" stroke="var(--color-chart-1)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="2026" stroke="var(--color-primary)" dot={false} strokeWidth={2.8} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>


        {/* DUCs inventario — módulo Pro */}
        <DucsPanel />


        {/* CTA — newsletter primario, Pro como lista de espera */}
        <div className="panel p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-display font-semibold text-lg">
                Un mail al mes con el estado real de Vaca Muerta
              </div>
              <div className="text-sm text-muted-foreground">
                4-5 visualizaciones nuevas y lectura de 3 minutos, disparadas con cada actualización del Capítulo IV.
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/pro"
              className="h-10 px-4 rounded-md border border-primary/40 text-primary text-sm font-medium inline-flex items-center gap-1.5 hover:bg-primary/10"
            >
              Lista de espera Pro
            </Link>
            <Link
              to="/newsletter"
              className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90"
            >
              Suscribirme <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DucsPanel() {
  const { isPro } = usePlan();
  const visibleRows = isPro ? ducsDemo : ducsDemo.slice(0, 3);
  const hiddenCount = ducsDemo.length - visibleRows.length;

  return (
    <div className="panel p-5 relative">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-primary font-medium inline-flex items-center gap-2">
            Inventario DUCs <ProPill />
          </div>
          <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
            <Drill className="h-4 w-4 text-primary" /> Pozos perforados sin completar
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Buffer de producción por operadora. YTD 2026 vs. mismo período 2025.
          </p>
        </div>
        <ProActionButton icon={Download}>Exportar tabla</ProActionButton>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Operadora</th>
              <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Área</th>
              <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">Perf. YTD</th>
              <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">Compl. YTD</th>
              <th className="text-right px-4 py-2.5 font-medium">DUCs</th>
              <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">Δ YoY</th>
              <th className="text-right px-4 py-2.5 font-medium">Buffer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleRows.map((r) => (
              <tr key={r.operatorSlug + r.area} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <Link
                    to="/operadoras/$slug"
                    params={{ slug: r.operatorSlug }}
                    className="font-medium hover:text-primary"
                  >
                    {r.operator}
                  </Link>
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">{r.area}</td>
                <td className="px-4 py-2.5 num text-right hidden sm:table-cell">{r.drilledYtd}</td>
                <td className="px-4 py-2.5 num text-right hidden sm:table-cell">{r.completedYtd}</td>
                <td className="px-4 py-2.5 num text-right font-semibold">{r.ducs}</td>
                <td className={`px-4 py-2.5 num text-right hidden md:table-cell ${r.ducsDeltaYoY < 0 ? "text-primary" : r.ducsDeltaYoY > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {r.ducsDeltaYoY > 0 ? "+" : ""}{r.ducsDeltaYoY}%
                </td>
                <td className="px-4 py-2.5 num text-right">{r.invBuffer.toFixed(1)} m</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isPro && hiddenCount > 0 && (
          <div className="relative">
            <div className="pointer-events-none select-none blur-[3px] opacity-60" aria-hidden>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {ducsDemo.slice(3).map((r) => (
                    <tr key={"blur-" + r.operatorSlug + r.area}>
                      <td className="px-4 py-2.5">{r.operator}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell">{r.area}</td>
                      <td className="px-4 py-2.5 num text-right hidden sm:table-cell">{r.drilledYtd}</td>
                      <td className="px-4 py-2.5 num text-right hidden sm:table-cell">{r.completedYtd}</td>
                      <td className="px-4 py-2.5 num text-right font-semibold">{r.ducs}</td>
                      <td className="px-4 py-2.5 num text-right hidden md:table-cell">
                        {r.ducsDeltaYoY > 0 ? "+" : ""}{r.ducsDeltaYoY}%
                      </td>
                      <td className="px-4 py-2.5 num text-right">{r.invBuffer.toFixed(1)} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="absolute inset-x-0 top-0 h-full flex items-center justify-center bg-gradient-to-b from-transparent via-background/60 to-background">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  {hiddenCount} operadoras más disponibles en <span className="text-primary font-medium">PetroData Pro</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
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
