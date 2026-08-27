import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { StatesWrapper } from "@/components/states";
import { ChartCard } from "@/components/chart-card";
import { ChartTooltip } from "@/components/chart-tooltip";
import { formatNumber } from "@/lib/format";
import { PALETTE, SERIES_COLORS } from "@/lib/palette";
import type { CompletionWell } from "@/lib/contract";

export const Route = createFileRoute("/fracturas")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Fracturas" },
      {
        name: "description",
        content:
          "Análisis de completación: cobertura de registros de fractura, largo de rama lateral, etapas y producción acumulada a 6 meses.",
      },
    ],
  }),
  component: FracturesPage,
});

function FracturesPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded data={data} />} />
    </div>
  );
}

function Loaded({ data }: { data: import("@/lib/contract").ObservatoryData }) {
  const c = data.completions;

  return (
    <>
      <PageHeader
        title="Fracturas"
        description="Relación entre la completación (largo de rama, etapas) y la producción acumulada del pozo a 6 meses. Sin línea de tendencia: los datos son puramente observacionales."
        meta={
          <>
            <span>{c.coverage.wells_with_fracture_record} pozos con registro de fractura</span>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCardGrid coverage={c.coverage} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Largo de rama lateral vs. producción acumulada (6 meses)"
          subtitle="Puntos por pozo; color por operador. El detector p25/p75 del largo discrimina los grupos."
        >
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChartData scatter={c.scatter} />
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Mediana de acumulado según ventanas"
          subtitle="Agrupado por la dimensión declarada en cada release (por ejemplo, etapa de fractura)."
        >
          {c.bucket_stats.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin buckets publicados.
            </p>
          ) : (
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.bucket_stats} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="oklch(0.3 0.008 240)"
                  />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNumber(Number(v))}
                    tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                    tickLine={false}
                    axisLine={false}
                    width={64}
                  />
                  <Tooltip
                    content={<ChartTooltip unit="m³" />}
                    cursor={{ fill: "oklch(0.24 0.01 240 / 0.4)" }}
                  />
                  <Bar
                    dataKey="median_cum_oil_6m_m3"
                    name="Mediana Σ 6 mo"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={42}
                  >
                    {c.bucket_stats.map((_, i) => (
                      <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Dimensión declarada: {c.bucket_stats[0]?.dimension ?? "—"}
          </p>
        </ChartCard>
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-card/50 p-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Aclaración:</span> {c.disclaimer}
      </div>
    </>
  );
}

function KpiCardGrid({ coverage }: { coverage: import("@/lib/contract").CompletionCoverage }) {
  return (
    <>
      <KpiCard label="Pozos con producción" displayValue={String(coverage.production_wells)} />
      <KpiCard
        label="Con registro de fractura"
        displayValue={String(coverage.wells_with_fracture_record)}
      />
      <KpiCard
        label="Coincidencia (match)"
        displayValue={String(coverage.matched_wells)}
        unit={`(${coverage.match_rate_pct.toFixed(1)}%)`}
      />
      <KpiCard
        label="Habilitados a normalizar"
        displayValue={String(coverage.eligible_for_normalization)}
        unit={`largo ${coverage.valid_horizontal_length_pct.toFixed(0)}% · étapas ${coverage.valid_stage_count_pct.toFixed(0)}%`}
      />
    </>
  );
}

function ScatterChartData({ scatter }: { scatter: CompletionWell[] }) {
  const data = scatter.map((w) => ({
    x: w.horizontal_length_m,
    y: w.cum_oil_6m_m3,
    name: w.well_id,
    operator: w.operator_slug,
    stages: w.stage_count,
  }));
  const operatorColors = new Map<string, string>();
  [...new Set(data.map((d) => d.operator))].forEach((op, i) => {
    operatorColors.set(op, SERIES_COLORS[i % SERIES_COLORS.length]);
  });

  return (
    <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.008 240)" />
      <XAxis
        type="number"
        dataKey="x"
        name="Rama lateral (m)"
        tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        type="number"
        dataKey="y"
        name="Σ 6 mo (m³)"
        tickFormatter={(v) => formatNumber(Number(v))}
        tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
        tickLine={false}
        axisLine={false}
        width={64}
      />
      <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
      {data.length === 0 ? null : (
        <Scatter name="Pozos" data={data} shape="circle">
          {data.map((d, i) => (
            <Cell key={i} fill={operatorColors.get(d.operator) ?? PALETTE.neutral} />
          ))}
        </Scatter>
      )}
    </ScatterChart>
  );
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: { x: number; y: number; name: string; operator: string; stages: number };
  }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-medium">{p.name}</div>
      <div className="mt-1 text-muted-foreground">
        Rama: {formatNumber(p.x)} m · Σ 6 mo: {formatNumber(p.y)} m³
        <br />
        Operador: {p.operator} · Etapas: {p.stages}
      </div>
    </div>
  );
}
