import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, Copy, ExternalLink, FlaskConical, Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { ChartTooltip } from "@/components/chart-tooltip";
import { StatesWrapper } from "@/components/states";
import { formatCompact, formatMonth, formatCutoffDate } from "@/lib/format";
import { PALETTE } from "@/lib/palette";
import type { HomeKpi, OperatorContribution } from "@/lib/contract";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Resumen mensual" },
      {
        name: "description",
        content:
          "Estado mensual de la producción en Vaca Muerta: petróleo y gas por operador, contribución al cambio y calidad de datos.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded data={data} />} />
    </div>
  );
}

function Loaded({ data }: { data: import("@/lib/contract").ObservatoryData }) {
  const [copied, setCopied] = useState(false);
  const { site, home, release } = data;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // sin acceso al portapapeles: no es crítico.
    }
  };

  const definitions = data.methodology.definitions;
  const definitionOf = (id: string | null | undefined) =>
    id ? definitions.find((d) => d.id === id)?.definition : undefined;

  const history = home.production_history.map((p) => ({
    period: p.period,
    oil_m3: p.oil_m3,
    gas_thousand_m3: p.gas_thousand_m3,
    water_m3: p.water_m3,
  }));

  const lastPeriod = history[history.length - 1]?.period;

  return (
    <>
      <PageHeader
        title={site.name}
        description={site.tagline}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
              Corte al {formatCutoffDate(release.data_cutoff)}
            </span>
            <a
              href={site.repository_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              Código y datos <ExternalLink className="h-3 w-3" />
            </a>
          </>
        }
        actions={
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input px-3 text-sm transition-colors hover:border-primary/50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Compartir"}
            </button>
          </span>
        }
      />

      {release.warning && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>{release.warning}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {home.kpis.map((kpi: HomeKpi) => (
          <KpiCard
            key={kpi.id}
            label={kpi.label}
            displayValue={kpi.display_value}
            unit={kpi.unit}
            changeMoM={kpi.change_mom_pct}
            changeYoY={kpi.change_yoy_pct}
            status={kpi.status}
            definition={definitionOf(kpi.definition_id)}
          />
        ))}
      </div>

      {/* Producion historica */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard
          title={`Producción · ${lastPeriod ? formatMonth(lastPeriod) : ""}`}
          subtitle="Series mensuales publicadas por la operación agregada."
          className="lg:col-span-2"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={history} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="oklch(0.3 0.008 240)"
                />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatMonth}
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="oil"
                  tickFormatter={(v) => formatCompact(Number(v))}
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <YAxis
                  yAxisId="gas"
                  orientation="right"
                  tickFormatter={(v) => formatCompact(Number(v))}
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "oklch(0.24 0.01 240 / 0.4)" }}
                />
                <Bar
                  dataKey="oil_m3"
                  name="Petróleo (m³)"
                  yAxisId="oil"
                  fill={PALETTE.oil}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  type="monotone"
                  dataKey="gas_thousand_m3"
                  name="Gas (miles de m³)"
                  yAxisId="gas"
                  stroke={PALETTE.gas}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE.oil }} />
              Petróleo (m³)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE.gas }} />
              Gas (miles de m³)
            </span>
          </div>
        </ChartCard>

        {/* Contribucion al cambio */}
        <ChartCard
          title="Contribución al cambio mensual"
          subtitle={`Variación de petróleo mixto por operador (${formatMonth(release.last_complete_period)}).`}
        >
          {home.operator_contributions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin datos de contribución.
            </p>
          ) : (
            <ul className="space-y-3">
              {home.operator_contributions.map((op: OperatorContribution) => (
                <ContributorBar key={op.operator_slug} op={op} />
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      {/* Insights */}
      {home.insights.length > 0 && (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {home.insights.map((insight) => (
            <div key={insight.id} className="rounded-lg border border-border/70 bg-card/50 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {insight.tone ? `Nota · ${insight.tone}` : "Nota"}
              </div>
              <div className="mt-2 text-sm font-medium">{insight.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{insight.body}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Datos de referencia: {site.source_label}. Consultá la metodología en{" "}
        <a
          href={site.methodology_url}
          className="underline underline-offset-2 hover:text-foreground"
        >
          /metodologia
        </a>
        .
      </p>
    </>
  );
}

function ContributorBar({ op }: { op: OperatorContribution }) {
  const max = Math.max(...[op.share_of_change_pct, 0]);
  const width = Math.max(Math.abs(op.share_of_change_pct), 0.5);
  const negative = op.share_of_change_pct < 0;
  return (
    <li>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="font-medium">{op.operator_name}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {negative ? `${op.share_of_change_pct}%` : `+${op.share_of_change_pct}%`}
          <span className="ml-1">· {formatCompact(op.delta_oil_m3)} m³</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={
            negative ? "h-full rounded-full bg-destructive/70" : "h-full rounded-full bg-primary"
          }
          style={{ width: `${max ? (width / max) * 100 : 0}%` }}
        />
      </div>
    </li>
  );
}
