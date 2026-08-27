import type { ProductId } from "./contract";
import type { ExplorerDimension, ExplorerFilters, MetricKey } from "./explorer";
import { PRODUCT_METRIC } from "./explorer";

// Nombres de query params legibles ("desde", "hasta", "operador", ...).
const PARAMS = {
  product: "producto",
  desde: "desde",
  hasta: "hasta",
  metric: "metrica",
  dimension: "comparar",
  operators: "operador",
  areas: "area",
  basins: "cuenca",
  provinces: "provincia",
  formations: "formacion",
  resourceTypes: "tipo",
  resourceSubtypes: "sub-tipo",
} as const;

const PRODUCT_IDS: ProductId[] = ["oil", "gas", "water"];

const DIMENSION_IDS: ExplorerDimension[] = [
  "operator",
  "area",
  "basin",
  "province",
  "formation",
  "resource_type",
  "resource_subtype",
];

export const METRIC_IDS: MetricKey[] = ["oil_m3", "gas_thousand_m3", "water_m3"];

export interface QueryStateDeps {
  products: { id: string }[];
  periods: string[];
  operators: { slug: string }[];
  areas: string[];
  basins: string[];
  provinces: string[];
  formations: string[];
  resourceTypes: string[];
  resourceSubtypes: string[];
}

function validOrUndefined(value: string | null, allowed: string[]): string | undefined {
  return value && allowed.includes(value) ? value : undefined;
}

function multiValidOrUndefined(values: string[], allowed: string[]): string[] | undefined {
  const filtered = values.filter((v) => allowed.includes(v));
  return filtered.length ? filtered : undefined;
}

export const EMPTY_FILTERS: ExplorerFilters = { product: "oil" };

/** Parsea los query params a filtros del explorador, validando contra las opciones. */
export function parseExplorerFilters(
  searchParams: URLSearchParams,
  deps: QueryStateDeps,
): ExplorerFilters {
  const productRaw = searchParams.get(PARAMS.product);
  const product = PRODUCT_IDS.includes(productRaw as ProductId) ? (productRaw as ProductId) : "oil";
  return {
    product,
    startPeriod: validOrUndefined(searchParams.get(PARAMS.desde), deps.periods),
    endPeriod: validOrUndefined(searchParams.get(PARAMS.hasta), deps.periods),
    operators: multiValidOrUndefined(
      searchParams.getAll(PARAMS.operators),
      deps.operators.map((o) => o.slug),
    ),
    areas: multiValidOrUndefined(searchParams.getAll(PARAMS.areas), deps.areas),
    basins: multiValidOrUndefined(searchParams.getAll(PARAMS.basins), deps.basins),
    provinces: multiValidOrUndefined(searchParams.getAll(PARAMS.provinces), deps.provinces),
    formations: multiValidOrUndefined(searchParams.getAll(PARAMS.formations), deps.formations),
    resourceTypes: multiValidOrUndefined(
      searchParams.getAll(PARAMS.resourceTypes),
      deps.resourceTypes,
    ),
    resourceSubtypes: multiValidOrUndefined(
      searchParams.getAll(PARAMS.resourceSubtypes),
      deps.resourceSubtypes,
    ),
  };
}

/** Serializa los filtros a query params legibles. */
export function filtersToSearchParams(filters: ExplorerFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set(PARAMS.product, filters.product);
  if (filters.startPeriod) params.set(PARAMS.desde, filters.startPeriod);
  if (filters.endPeriod) params.set(PARAMS.hasta, filters.endPeriod);
  const appendMulti = (name: string, values?: string[]) =>
    values?.forEach((v) => params.append(name, v));
  appendMulti(PARAMS.operators, filters.operators);
  appendMulti(PARAMS.areas, filters.areas);
  appendMulti(PARAMS.basins, filters.basins);
  appendMulti(PARAMS.provinces, filters.provinces);
  appendMulti(PARAMS.formations, filters.formations);
  appendMulti(PARAMS.resourceTypes, filters.resourceTypes);
  appendMulti(PARAMS.resourceSubtypes, filters.resourceSubtypes);
  return params;
}

export function parseMetric(searchParams: URLSearchParams): MetricKey {
  const raw = searchParams.get(PARAMS.metric);
  return METRIC_IDS.includes(raw as MetricKey) ? (raw as MetricKey) : "oil_m3";
}

export function metricFromProduct(product: ProductId): MetricKey {
  return PRODUCT_METRIC[product];
}

export function parseDimension(searchParams: URLSearchParams): ExplorerDimension {
  const raw = searchParams.get(PARAMS.dimension);
  return DIMENSION_IDS.includes(raw as ExplorerDimension) ? (raw as ExplorerDimension) : "operator";
}

export function dimensionToSearchParam(dimension: ExplorerDimension): string {
  return dimension;
}

export function productToSearchParam(product: ProductId): string {
  return product;
}
