import type { ExplorerRow, ProductId, FilterProduct, ReleasePointer } from "./contract";

// Dimensiones de agrupación del explorador y su columna en ExplorerRow.
export type ExplorerDimension =
  | "operator"
  | "area"
  | "basin"
  | "province"
  | "formation"
  | "resource_type"
  | "resource_subtype";

export type MetricKey = "oil_m3" | "gas_thousand_m3" | "water_m3";

export const PRODUCT_METRIC: Record<ProductId, MetricKey> = {
  oil: "oil_m3",
  gas: "gas_thousand_m3",
  water: "water_m3",
};

export const DIMENSION_KEY: Record<ExplorerDimension, keyof ExplorerRow> = {
  operator: "operator_slug",
  area: "area",
  basin: "basin",
  province: "province",
  formation: "formation",
  resource_type: "resource_type",
  resource_subtype: "resource_subtype",
};

export interface ExplorerFilters {
  product: ProductId;
  startPeriod?: string;
  endPeriod?: string;
  operators?: string[];
  areas?: string[];
  basins?: string[];
  provinces?: string[];
  formations?: string[];
  resourceTypes?: string[];
  resourceSubtypes?: string[];
}

export const EXPLORER_DIMENSIONS: { value: ExplorerDimension; label: string }[] = [
  { value: "operator", label: "Operador" },
  { value: "area", label: "Área" },
  { value: "basin", label: "Cuenca" },
  { value: "province", label: "Provincia" },
  { value: "formation", label: "Formación" },
  { value: "resource_type", label: "Tipo de recurso" },
  { value: "resource_subtype", label: "Subtipo de recurso" },
];

/** Filtra las filas del explorador aplicando los filtros activos. */
export function filterExplorerRows(rows: ExplorerRow[], filters: ExplorerFilters): ExplorerRow[] {
  return rows.filter((r) => {
    if (filters.startPeriod && r.period < filters.startPeriod) return false;
    if (filters.endPeriod && r.period > filters.endPeriod) return false;
    if (filters.operators?.length && !filters.operators.includes(r.operator_slug)) return false;
    if (filters.areas?.length && !filters.areas.includes(r.area)) return false;
    if (filters.basins?.length && !filters.basins.includes(r.basin)) return false;
    if (filters.provinces?.length && !filters.provinces.includes(r.province)) return false;
    if (filters.formations?.length && !filters.formations.includes(r.formation)) return false;
    if (filters.resourceTypes?.length && !filters.resourceTypes.includes(r.resource_type))
      return false;
    if (filters.resourceSubtypes?.length && !filters.resourceSubtypes.includes(r.resource_subtype))
      return false;
    return true;
  });
}

export interface SeriesPoint {
  period: string;
  value: number;
}

export interface MetricSeries {
  key: string;
  label: string;
  points: SeriesPoint[];
  total: number;
}

/** Serie mensual de la métrica por dimensión, hasta 5 series ordenadas por total. */
export function seriesBy(
  rows: ExplorerRow[],
  filters: ExplorerFilters,
  dimension: ExplorerDimension,
  metric: MetricKey,
  maxSeries = 5,
): MetricSeries[] {
  const filtered = filterExplorerRows(rows, filters);
  const keyCol = DIMENSION_KEY[dimension];
  const groups = new Map<string, ExplorerRow[]>();
  for (const row of filtered) {
    const raw = String(row[keyCol] ?? "Sin dato");
    const arr = groups.get(raw) ?? [];
    arr.push(row);
    groups.set(raw, arr);
  }
  const built = [...groups.entries()].map(([raw, group]) => {
    const byPeriod = new Map<string, number>();
    let total = 0;
    for (const r of group) {
      const v = Number(r[metric] ?? 0);
      total += v;
      byPeriod.set(r.period, (byPeriod.get(r.period) ?? 0) + v);
    }
    const points = [...byPeriod.entries()]
      .map(([period, value]) => ({ period, value }))
      .sort((a, b) => a.period.localeCompare(b.period));
    const label = dimension === "operator" ? (group[0]?.operator_name ?? raw) : (raw as string);
    return { key: raw, label, points, total };
  });
  return built.sort((a, b) => b.total - a.total).slice(0, maxSeries);
}

export interface DimensionSummary {
  key: string;
  label: string;
  wells: number;
  total: number;
  shareOfTop: number;
}

/** Ranking de una dimensión (fila por grupo) para la tabla del explorador. */
export function summarizeDimension(
  rows: ExplorerRow[],
  filters: ExplorerFilters,
  dimension: ExplorerDimension,
  metric: MetricKey,
): DimensionSummary[] {
  const filtered = filterExplorerRows(rows, filters);
  const keyCol = DIMENSION_KEY[dimension];
  const groups = new Map<string, ExplorerRow[]>();
  for (const row of filtered) {
    const raw = String(row[keyCol] ?? "Sin dato");
    const arr = groups.get(raw) ?? [];
    arr.push(row);
    groups.set(raw, arr);
  }
  const items = [...groups.entries()].map(([raw, group]) => {
    let total = 0;
    const wells = new Set<number>();
    for (const r of group) {
      total += Number(r[metric] ?? 0);
      wells.add(r.productive_wells);
    }
    const label = dimension === "operator" ? (group[0]?.operator_name ?? raw) : (raw as string);
    return { key: raw, label, wells: wells.size, total, shareOfTop: 0 };
  });
  items.sort((a, b) => b.total - a.total);
  const top = items[0]?.total ?? 0;
  return items.map((item) => ({
    ...item,
    shareOfTop: top > 0 ? (item.total / top) * 100 : 0,
  }));
}

/** Label legible de un producto. */
export function productLabel(productId: ProductId, products: FilterProduct[]): string {
  return products.find((p) => p.id === productId)?.label ?? productId;
}

/** Unit de un producto. */
export function productUnit(productId: ProductId, products: FilterProduct[]): string {
  return products.find((p) => p.id === productId)?.unit ?? "";
}

/** Combina pointer (latest.json) con datos para metadatos del release. */
export function releaseLabel(
  pointer: ReleasePointer | null,
  release: { release_id: string; status: string } | undefined,
): string {
  return release?.release_id ?? pointer?.release_id ?? "release desconocido";
}
