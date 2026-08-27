import { useMemo, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Bar,
  BarChart,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { StatesWrapper, StatesEmpty } from "@/components/states";
import { ChartCard } from "@/components/chart-card";
import { ChartTooltip } from "@/components/chart-tooltip";
import { FilterBar, LegendChips, filterDepsFromData } from "@/components/filter-bar";
import {
  EXPLORER_DIMENSIONS,
  productLabel,
  productUnit,
  seriesBy,
  summarizeDimension,
} from "@/lib/explorer";
import {
  formatCompact,
  formatMonth,
  formatNumber,
  formatPct,
  formatCutoffDate,
} from "@/lib/format";
import { useExplorerQueryState } from "@/lib/explorer-hook";
import { SERIES_COLORS } from "@/lib/palette";
import { metricFromProduct } from "@/lib/query-state";
import type { ObservatoryData } from "@/lib/contract";

export const Route = createFileRoute("/produccion")({
  validateSearch: (input: Record<string, unknown>): Record<string, unknown> => input,
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Producción" },
      {
        name: "description",
        content:
          "Serie mensual de producción de petróleo, gas y agua, comparación por operador, área, cuenca y provincia, con descarga de los datos subyacentes.",
      },
    ],
  }),
  component: ProductionPage,
});

function ProductionPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded data={data} />} />
    </div>
  );
}

function Loaded({ data }: { data: ObservatoryData }) {
  const deps = useMemo(() => filterDepsFromData(data), [data]);
  const { filters, dimension, setFilters, setDimension } = useExplorerQueryState(deps);

  const product = filters.product;
  const metric = metricFromProduct(product);
  const label = productLabel(product, deps.products);
  const unit = productUnit(product, deps.products);

  const series = useMemo(
    () => seriesBy(data.explorer.rows, filters, dimension, metric, 5),
    [data.explorer.rows, filters, dimension, metric],
  );

  const totals = useMemo(
    () => summarizeDimension(data.explorer.rows, filters, dimension, metric),
    [data.explorer.rows, filters, dimension, metric],
  );

  const allPeriods = data.filter_options.periods;
  const lastPeriod = allPeriods[allPeriods.length - 1];

  const hasFilters =
    Boolean(filters.startPeriod || filters.endPeriod) ||
    Boolean(
      filters.operators?.length ||
      filters.areas?.length ||
      filters.basins?.length ||
      filters.provinces?.length ||
      filters.formations?.length ||
      filters.resourceTypes?.length ||
      filters.resourceSubtypes?.length,
    );

  const legend = series.map((s, i) => ({
    key: s.key,
    label: s.label,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  const dimensionLabel = (v: string) => EXPLORER_DIMENSIONS.find((d) => d.value === v)?.label ?? v;

  return (
    <>
      <PageHeader
        title="Producción"
        description={`Serie mensual filtrable de ${label.toLowerCase()} y gas según la dimensión elegida. Los filtros se reflejan en la URL (compartible).`}
        meta={
          <>
            <span>Al corte {formatCutoffDate(data.release.data_cutoff)}</span>
            <span className="text-muted-foreground">· {data.release.release_id}</span>
          </>
        }
        actions={
          <Select value={dimension} onValueChange={(v) => setDimension(v as never)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Comparar por" />
            </SelectTrigger>
            <SelectContent>
              {EXPLORER_DIMENSIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  Comparar por {d.label.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <FilterBar
        deps={deps}
        value={filters}
        onChange={setFilters}
        controls={
          hasFilters ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              onClick={() =>
                setFilters({
                  ...filters,
                  startPeriod: undefined,
                  endPeriod: undefined,
                  operators: undefined,
                  areas: undefined,
                  basins: undefined,
                  provinces: undefined,
                  formations: undefined,
                  resourceTypes: undefined,
                  resourceSubtypes: undefined,
                })
              }
            >
              Limpiar filtros
            </button>
          ) : undefined
        }
      />

      <div className="mt-6 grid gap-4">
        <ChartCard
          title={`${label} y gas · comparación por ${dimensionLabel(dimension)}`}
          subtitle={`Último período: ${lastPeriod ? formatMonth(lastPeriod) : "—"}. Se muestran hasta 5 series por volumen total.`}
          actions={
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              Metrica <BadgeMetric>{unit}</BadgeMetric>
            </span>
          }
        >
          {series.length === 0 ? (
            <StatesEmpty>
              Sin datos para los filtros seleccionados. Ajustá el rango de períodos.
            </StatesEmpty>
          ) : (
            <>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={seriesData(series)}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
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
                      tickFormatter={(v) => formatCompact(Number(v))}
                      tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                    />
                    <Tooltip
                      content={<ChartTooltip unit={unit} />}
                      cursor={{ strokeDasharray: "3 3", stroke: "oklch(0.5 0.01 240)" }}
                    />
                    {series.map((s, i) => (
                      <Line
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {legend.length > 1 && <LegendChips items={legend} />}
            </>
          )}
        </ChartCard>

        {totals.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title={`Composición mensual · ${label}`}
              subtitle="Participación acumulada en cada período según la dimensión elegida."
            >
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={seriesData(series)}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
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
                      tickFormatter={(v) => formatCompact(Number(v))}
                      tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                    />
                    <Tooltip
                      content={<ChartTooltip unit={unit} />}
                      cursor={{ fill: "oklch(0.24 0.01 240 / 0.4)" }}
                    />
                    {series.map((s, i) => (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.label}
                        stackId="comp"
                        fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                        maxBarSize={24}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {legend.length > 1 && <LegendChips items={legend} />}
            </ChartCard>
            <ChartCard
              title={`Ranking por ${dimensionLabel(dimension)}`}
              subtitle={`Total del período seleccionado en ${unit}.`}
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>{dimensionLabel(dimension)}</TableHead>
                      <TableHead className="text-right">Total ({unit})</TableHead>
                      <TableHead className="text-right">Distribución</TableHead>
                      <TableHead className="text-right">Pozos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totals.map((row, idx) => (
                      <TableRow key={row.key}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(row.total)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatPct(row.shareOfTop)} del líder
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatNumber(row.wells)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ChartCard>
          </div>
        )}
      </div>
    </>
  );
}

function BadgeMetric({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
      {children}
    </span>
  );
}

/** Convierte las series a filas de datos para Recharts (un periodo por fila). */
function seriesData(series: { key: string; points: { period: string; value: number }[] }[]) {
  const periods = Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.period)))).sort();
  return periods.map((period) => {
    const row: Record<string, string | number> = { period };
    for (const s of series) {
      row[s.key] = s.points.find((p) => p.period === period)?.value ?? 0;
    }
    return row;
  });
}
