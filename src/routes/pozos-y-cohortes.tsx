import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { StatesWrapper, StatesEmpty } from "@/components/states";
import { ChartCard } from "@/components/chart-card";
import { formatNumber } from "@/lib/format";
import { SERIES_COLORS } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { CohortCurve, CohortPoint } from "@/lib/contract";

export const Route = createFileRoute("/pozos-y-cohortes")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Pozos y cohortes" },
      {
        name: "description",
        content:
          "Curvas de declinación mediana por cohorte de pozos (área, formación y trimestre de inicio), con percentiles y tamaño de muestra.",
      },
    ],
  }),
  component: CohortsPage,
});

const MAX_COHORTS = 5;

function CohortsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded data={data} />} />
    </div>
  );
}

function Loaded({ data }: { data: import("@/lib/contract").ObservatoryData }) {
  const { curves, minimum_sample_size, default_metric } = data.cohorts;
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    curves.map((c) => c.id).slice(0, Math.min(3, MAX_COHORTS)),
  );

  const eligible = useMemo(
    () => curves.filter((c) => c.sample_size >= minimum_sample_size),
    [curves, minimum_sample_size],
  );

  const rows = useMemo(() => {
    const selected = curves.filter((c) => selectedIds.includes(c.id));
    const ages = Array.from(
      new Set(selected.flatMap((c) => c.points.map((p) => p.well_age_month))),
    ).sort((a, b) => a - b);
    return ages.map((age) => {
      const row: Record<string, number | null> = { age };
      for (const c of selected) {
        row[`median__${c.id}`] = c.points.find((p) => p.well_age_month === age)?.median ?? null;
      }
      return row;
    });
  }, [curves, selectedIds]);

  const selected = curves.filter((c) => selectedIds.includes(c.id));
  const unit = selected[0]?.unit ?? "";

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COHORTS) return prev;
      return [...prev, id];
    });
  };

  return (
    <>
      <PageHeader
        title="Pozos y cohortes"
        description={`Producción mediana por edad del pozo (meses) para cohortes definidas por área · formación · trimestre de inicio. Para publicar una cohorte hacen falta al menos ${minimum_sample_size} pozos. La métrica por defecto es ${default_metric}.`}
        meta={
          <>
            <span>Seleccioná hasta {MAX_COHORTS} cohortes.</span>
          </>
        }
      />

      <ChartCard
        title="Curvas de declinación (mediana por mes de vida)"
        subtitle={`Unidad: ${unit || "según cohorte"}. Las bandas p25/p75 se ven en el tooltip.`}
        actions={<CohortPicker eligible={eligible} selectedIds={selectedIds} onToggle={toggle} />}
      >
        {selected.length === 0 ? (
          <StatesEmpty>Elegí al menos una cohorte para ver su curva.</StatesEmpty>
        ) : (
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="oklch(0.3 0.008 240)"
                />
                <XAxis
                  dataKey="age"
                  type="number"
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v} mo`}
                />
                <YAxis
                  tickFormatter={(v) => formatNumber(Number(v))}
                  tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <Tooltip content={<CohortTooltip selected={selected} />} />
                <Legend />
                {selected.map((c, i) => (
                  <Line
                    key={c.id}
                    type="monotone"
                    dataKey={`median__${c.id}`}
                    name={c.label}
                    stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {selected.length > 0 && data.cohorts.cumulative_summary.length > 0 && (
        <div className="mt-4">
          <CumulativeTable curves={selected} summaries={data.cohorts.cumulative_summary} />
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Los percentiles se calculan por edad del pozo sobre el conjunto de la cohorte, sin serie
        individual (datos agregados). Ver /metodologia.
      </p>
    </>
  );
}

function CohortPicker({
  eligible,
  selectedIds,
  onToggle,
}: {
  eligible: CohortCurve[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex max-w-[480px] flex-wrap justify-end gap-1.5">
      {eligible.map((c) => {
        const active = selectedIds.includes(c.id);
        const atLimit = selectedIds.length >= MAX_COHORTS && !active;
        return (
          <button
            key={c.id}
            type="button"
            disabled={atLimit}
            onClick={() => onToggle(c.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
              active
                ? "border-primary/60 bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/40",
              atLimit && "cursor-not-allowed opacity-40",
            )}
          >
            {c.label}
            <span className="text-[10px] text-muted-foreground">n={c.sample_size}</span>
          </button>
        );
      })}
    </div>
  );
}

function CohortTooltip({
  active,
  payload,
  label,
  selected,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number | string;
    color?: string;
  }>;
  label?: number;
  selected: CohortCurve[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const age = label ?? 0;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium text-foreground">Mes de vida: {age}</div>
      <ul className="space-y-1">
        {payload.map((entry, idx) => {
          const curve = selected.find(
            (c) => c.id === String(entry.dataKey).replace("median__", ""),
          );
          const point: CohortPoint | undefined = curve?.points.find(
            (p) => p.well_age_month === age,
          );
          return (
            <li key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color ?? "var(--primary)" }}
                />
                {curve?.label}
              </span>
              <span className="tabular-nums">
                {formatNumber(Number(entry.value))} {curve?.unit}
                <span className="ml-1 text-muted-foreground">
                  (p25 {point ? compactPct(point.p25) : "—"} · p75{" "}
                  {point ? compactPct(point.p75) : "—"} · n={point?.well_count ?? "—"})
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function compactPct(v: number | null): string {
  return v === null || v === undefined ? "—" : formatNumber(v);
}

function CumulativeTable({
  curves,
  summaries,
}: {
  curves: CohortCurve[];
  summaries: {
    cohort_id: string;
    cum_3: number | null;
    cum_6: number | null;
    cum_12: number | null;
    unit: string;
    n_3: number;
    n_6: number;
    n_12: number;
  }[];
}) {
  const rows = summaries.filter((s) => curves.some((c) => c.id === s.cohort_id));
  if (rows.length === 0) return null;
  return (
    <ChartCard
      title="Producción acumulada por ventana"
      subtitle={`Acumulado a 3, 6 y 12 meses (${rows[0]?.unit ?? ""}). “Sin ventana completa” = cohorte aún en curso.`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Cohorte</th>
              <th className="px-3 py-2 text-right">Σ 3 mo</th>
              <th className="px-3 py-2 text-right">Σ 6 mo</th>
              <th className="px-3 py-2 text-right">Σ 12 mo</th>
              <th className="px-3 py-2 text-right">n</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const label = curves.find((c) => c.id === row.cohort_id)?.label ?? row.cohort_id;
              return (
                <tr key={row.cohort_id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium">{label}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {row.cum_3 === null ? "Sin ventana completa" : formatNumber(row.cum_3)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {row.cum_6 === null ? "Sin ventana completa" : formatNumber(row.cum_6)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {row.cum_12 === null ? "Sin ventana completa" : formatNumber(row.cum_12)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {Math.max(row.n_3, row.n_6, row.n_12)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
