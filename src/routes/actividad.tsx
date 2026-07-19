import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader, Stat, HelpTooltip } from "@/components/app-shell";
import {
  activitySeries,
  fracSpreadSeries,
  ducsDemo,
  kpis,
  ARENA_PRELIMINAR,
  CUTOFF,
} from "@/lib/mock-data";
import { Drill, Info, Activity } from "lucide-react";

export const Route = createFileRoute("/actividad")({
  head: () => ({
    meta: [
      { title: "Actividad & DUCs · T7 — PetroData" },
      {
        name: "description",
        content:
          "Monitor de completación casi en tiempo real: etapas de fractura, pozos conectados, DUCs e intensidad de completación desde el Adjunto IV.",
      },
    ],
  }),
  component: ActividadPage,
});

const last = activitySeries[activitySeries.length - 1];
const prev = activitySeries[activitySeries.length - 2];
const lastYearIdx = activitySeries.findIndex((r) => r.fecha === last.fecha.replace("2026", "2025"));
const lastYear = lastYearIdx >= 0 ? activitySeries[lastYearIdx] : null;

// B3: ratio de actividad — pozos conectados / etapas (eficiencia de completación)
const ratioSeries = activitySeries.map((r) => ({
  fecha: r.fecha,
  ratio: r.etapas > 0 ? +(r.etapas / r.pozos_conectados).toFixed(1) : null,
}));

function ActividadPage() {
  const etapasMoM =
    prev.etapas > 0
      ? (((last.etapas - prev.etapas) / prev.etapas) * 100).toFixed(1)
      : null;
  const etapasYoY =
    lastYear
      ? (((last.etapas - lastYear.etapas) / lastYear.etapas) * 100).toFixed(1)
      : null;
  const pozosMoM =
    prev.pozos_conectados > 0
      ? (((last.pozos_conectados - prev.pozos_conectados) / prev.pozos_conectados) * 100).toFixed(1)
      : null;

  const lastSpread = fracSpreadSeries[fracSpreadSeries.length - 1];
  const prevSpread = fracSpreadSeries[fracSpreadSeries.length - 2];
  const spreadMoM =
    prevSpread.spreads > 0
      ? (((lastSpread.spreads - prevSpread.spreads) / prevSpread.spreads) * 100).toFixed(1)
      : null;

  return (
    <AppShell>
      <PageHeader
        eyebrow={CUTOFF}
        title="Actividad & DUCs"
        description="Monitor de completación desde el Adjunto IV (SE). Etapas de fractura y pozos conectados actualizados con cada corrida del pipeline. Métrica insignia: el dato de etapas/día que hoy la prensa publica con fuentes privadas."
      />

      <div className="p-6 space-y-6">

        {/* KPIs row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label={`Etapas de fractura (${last.fecha})`}
            value={last.etapas.toLocaleString()}
            unit="etapas"
            delta={etapasMoM ? `${Number(etapasMoM) >= 0 ? "+" : ""}${etapasMoM}% MoM` : undefined}
            hint={etapasYoY ? `YoY ${Number(etapasYoY) >= 0 ? "+" : ""}${etapasYoY}%` : undefined}
            tooltip="Etapas de fractura completadas en el mes según el Adjunto IV oficial. El indicador de actividad más citado del sector."
          />
          <Stat
            label={`Pozos conectados (${last.fecha})`}
            value={last.pozos_conectados.toString()}
            delta={pozosMoM ? `${Number(pozosMoM) >= 0 ? "+" : ""}${pozosMoM}% MoM` : undefined}
            hint={`YTD: ${kpis.pozos_conectados_ytd} vs. ${kpis.pozos_conectados_ytd_prev} (2025)`}
            tooltip="Pozos que registraron su primera producción en el mes. Proxy oficial del ritmo de puesta en marcha."
          />
          <Stat
            label="Sets de fractura activos (est.)"
            value={lastSpread.spreads.toString()}
            delta={spreadMoM ? `${Number(spreadMoM) >= 0 ? "+" : ""}${spreadMoM}% MoM` : undefined}
            hint="Proxy frac spread count · metodología abajo"
            tooltip="Equipos de fractura operando en simultáneo, estimados por solapamiento de fechas de trabajos en el Adjunto IV. Siempre «estimado»."
          />
          <Stat
            label="Etapas promedio / pozo"
            value={kpis.etapas_promedio.toFixed(1)}
            unit="etapas"
            hint={`Rama: ${kpis.rama_promedio_m.toLocaleString()} m · Adjunto IV`}
            tooltip="Cantidad promedio de etapas de fractura por pozo horizontal terminado en el período."
          />
        </div>

        {ARENA_PRELIMINAR && (
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground border border-border/60 rounded-md px-3 py-2 bg-muted/20">
            <Info className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            Arena de {kpis.arena_mes} ({Math.round(kpis.arena_tn / 1000)}k tn) refleja rezago de carga del Adjunto IV — abril subreportado. Leer con 1 mes de rezago.
          </div>
        )}

        {/* Series: etapas y pozos conectados */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                Métrica insignia — A2
              </div>
              <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
                Etapas de fractura por mes
                <HelpTooltip text="Etapas de fractura completadas en el mes según el Adjunto IV oficial. El indicador de actividad más citado del sector." />
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Adjunto IV oficial · dato diario con ~1 mes de rezago
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={activitySeries} margin={{ left: -10, right: 12, top: 4 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <Tooltip content={<ChartTooltip unit="etapas" />} />
                  <Bar
                    dataKey="etapas"
                    name="Etapas"
                    fill="var(--color-primary)"
                    opacity={0.85}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                A3 — Pozos conectados
              </div>
              <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
                Pozos con primera producción por mes
                <HelpTooltip text="Pozos que registraron su primera producción en el mes. Proxy oficial del ritmo de puesta en marcha." />
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Padrón activo (F1b) · primer mes con producción oil &gt; 0
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={activitySeries} margin={{ left: -10, right: 12, top: 4 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <Tooltip content={<ChartTooltip unit="pozos" />} />
                  <Bar
                    dataKey="pozos_conectados"
                    name="Pozos conectados"
                    fill="var(--color-chart-2)"
                    opacity={0.85}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* B1 + B3 */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                B1 — Estimado
              </div>
              <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Sets de fractura activos
                <HelpTooltip text="Equipos de fractura operando en simultáneo, estimados por solapamiento de fechas de trabajos en el Adjunto IV. Siempre «estimado»." />
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Proxy del frac spread count. Metodología: trabajos con fechas solapadas (F2). Publicado siempre como «estimado».
              </p>
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={fracSpreadSeries} margin={{ left: -10, right: 12, top: 4 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <Tooltip content={<ChartTooltip unit="spreads" />} />
                  <Line
                    type="monotone"
                    dataKey="spreads"
                    name="Spreads activos (est.)"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                B3 — Ratio actividad
              </div>
              <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
                Etapas por pozo conectado
                <HelpTooltip text="Etapas de fractura del mes divididas por pozos conectados. Intensidad de completación versus puesta en marcha." />
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Eficiencia de completación agregada mensual. Sube si los pozos son más intensivos o si hay menos conexiones relativas.
              </p>
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={ratioSeries} margin={{ left: -10, right: 12, top: 4 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <Tooltip content={<ChartTooltip unit="etapas/pozo" />} />
                  <Line
                    type="monotone"
                    dataKey="ratio"
                    name="Etapas/pozo conectado"
                    stroke="var(--color-chart-4)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* A8 — Intensidad de completación */}
        <div className="panel p-5">
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
              A8 — Intensidad de completación
            </div>
            <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
              Parámetros técnicos promedio nacional
              <HelpTooltip text="Diseño de completación promedio del período: etapas, rama lateral, arena por pozo y origen de la arena." />
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Adjunto IV · promedio de pozos horizontales NC al corte {kpis.corte}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <IntensityCard
              label="Etapas de fractura"
              value={kpis.etapas_promedio.toFixed(1)}
              unit="por pozo"
              note="Secciones fracturadas hidráulicamente en el horizontal"
            />
            <IntensityCard
              label="Rama lateral"
              value={kpis.rama_promedio_m.toLocaleString()}
              unit="m"
              note="Longitud horizontal promedio del pozo"
            />
            <IntensityCard
              label="Arena bombeada"
              value={`${Math.round(kpis.arena_tn / last.pozos_conectados / 1000 * 10) / 10}k`}
              unit="tn / pozo"
              note={ARENA_PRELIMINAR ? "Dato arena preliminar (rezago)" : "Por pozo conectado en el mes"}
            />
            <IntensityCard
              label="Arena importada"
              value={kpis.arena_pct_importada === 0 ? "0%" : `${kpis.arena_pct_importada}%`}
              unit=""
              note={kpis.arena_pct_importada === 0 ? "100% arena nacional" : "Del total bombeado"}
            />
          </div>
        </div>

        {/* Fracturados sin conectar — inventario */}
        <div className="panel p-5">
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
              A4 — Conexión pendiente
            </div>
            <h2 className="text-lg font-display font-semibold mt-1 inline-flex items-center gap-2">
              <Drill className="h-4 w-4 text-primary" /> Fracturados sin conectar
              <HelpTooltip text="Pozos con fractura terminada que aún no registraron primera producción. Inventario de conexión pendiente por operadora." />
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Pozos con fecha_fin_fractura registrada y sin primera producción. YTD 2026 vs. mismo período 2025.
            </p>
          </div>

          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Operadora</th>
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Área</th>
                  <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">Fract. YTD</th>
                  <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">Conect. YTD</th>
                  <th className="text-right px-4 py-2.5 font-medium">F.s.C.</th>
                  <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">Δ YoY</th>
                  <th className="text-right px-4 py-2.5 font-medium">Buffer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ducsDemo.map((r) => (
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
                    <td
                      className={`px-4 py-2.5 num text-right hidden md:table-cell ${r.ducsDeltaYoY < 0 ? "text-primary" : r.ducsDeltaYoY > 0 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {r.ducsDeltaYoY > 0 ? "+" : ""}{r.ducsDeltaYoY}%
                    </td>
                    <td className="px-4 py-2.5 num text-right">{r.invBuffer.toFixed(1)} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metodología B1 */}
        <div className="panel p-5 border-l-4 border-l-muted-foreground/30">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
            Metodología
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            <strong className="text-foreground">Sets de fractura activos (B1):</strong> estimado
            a partir del conteo de trabajos del Adjunto IV con fechas de inicio/fin solapadas en
            un mismo día. Se publica siempre como «estimado» porque el Adjunto IV no informa
            equipos directamente. El método equivalente al frac spread count de Primary Vision
            (datos privados). <strong className="text-foreground">Conexión pendiente / FsC (A4):</strong> pozos con{" "}
            <code>fecha_fin_fractura</code> (F2) registrada y sin primera producción en el Padrón
            (F1b). Se llama «fracturados sin conectar» porque el DUC clásico (drilled but uncompleted,
            perforado sin fracturar) no es observable: el Adjunto IV no informa el tramo de
            perforación. <code>invBuffer</code> = FsC / conexiones recientes por mes.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function IntensityCard({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
}) {
  return (
    <div className="border border-border rounded-md p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <div className="num text-2xl font-semibold">{value}</div>
        {unit && <div className="text-xs text-muted-foreground">{unit}</div>}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{note}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
      <div className="text-muted-foreground mb-1 font-mono">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className="text-foreground">{p.name}</span>
          <span className="num ml-auto text-foreground font-medium">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
