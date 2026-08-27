// Tipos del contrato JSON de Pulso Vaca Muerta (schema_version 1.x).
// Deben reflejar exactamente la forma de public/data/releases/*/app-data.json.

export type ReleaseStatus = "mock" | "complete" | "warning";

// ─────────────────────────────────────────────────────────────
// Puntero de release (latest.json)
// ─────────────────────────────────────────────────────────────
export interface ReleasePointer {
  release_id: string;
  data_cutoff: string;
  generated_at: string;
  schema_version: string;
  status: ReleaseStatus;
  base_path: string;
  app_data_file: string;
}

// ─────────────────────────────────────────────────────────────
// Payload principal (app-data.json)
// ─────────────────────────────────────────────────────────────
export interface ObservatoryData {
  schema_version: string;
  release: ReleaseMetadata;
  site: SiteMetadata;
  filter_options: FilterOptions;
  home: HomeData;
  explorer: ExplorerData;
  operators: OperatorsData;
  cohorts: CohortsData;
  completions: CompletionsData;
  map: MapData;
  quality: QualityData;
  downloads: DownloadArtifact[];
  methodology: MethodologyData;
  release_history: ReleaseHistoryItem[];
}

export interface ReleaseMetadata {
  release_id: string;
  status: ReleaseStatus;
  is_mock: boolean;
  data_cutoff: string;
  generated_at: string;
  last_complete_period: string;
  pipeline_commit: string;
  warning?: string | null;
}

export interface SiteMetadata {
  name: string;
  tagline: string;
  locale: string;
  default_scope: string;
  methodology_url: string;
  source_label: string;
  repository_url: string;
}

// ─────────────────────────────────────────────────────────────
// Filtros
// ─────────────────────────────────────────────────────────────
export interface FilterProduct {
  id: string;
  label: string;
  unit: string;
}

export interface FilterOptions {
  periods: string[];
  products: FilterProduct[];
  resource_types: string[];
  resource_subtypes: string[];
  operators: { slug: string; label: string }[];
  provinces: string[];
  basins: string[];
  areas: string[];
  fields: string[];
  formations: string[];
}

// ─────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────
export interface HomeKpi {
  id: string;
  label: string;
  value: number;
  display_value?: string | null;
  unit?: string | null;
  change_mom_pct?: number | null;
  change_yoy_pct?: number | null;
  status?: string | null;
  definition_id?: string | null;
}

export interface ProductionHistoryPoint {
  period: string; // ISO date (primer día del mes)
  oil_m3: number;
  gas_thousand_m3: number;
  water_m3: number;
  oil_conventional_m3: number;
  oil_nonconventional_m3: number;
  gas_conventional_thousand_m3: number;
  gas_nonconventional_thousand_m3: number;
  productive_wells: number;
  is_complete?: boolean | null;
}

export interface OperatorContribution {
  operator_slug: string;
  operator_name: string;
  delta_oil_m3: number;
  share_of_change_pct: number;
}

export interface HomeInsight {
  id: string;
  title: string;
  body: string;
  tone?: "positive" | "neutral" | "information" | string | null;
}

export interface HomeData {
  kpis: HomeKpi[];
  production_history: ProductionHistoryPoint[];
  operator_contributions: OperatorContribution[];
  insights: HomeInsight[];
}

// ─────────────────────────────────────────────────────────────
// Explorador
// ─────────────────────────────────────────────────────────────
export type ProductId = "oil" | "gas" | "water";

export interface ExplorerDefaultState {
  product?: ProductId | null;
  metric?: string | null;
  start_period?: string | null;
  end_period?: string | null;
  compare_by?: string | null;
}

export interface ExplorerRow {
  period: string;
  operator_slug: string;
  operator_name: string;
  province: string;
  basin: string;
  area: string;
  field: string;
  formation: string;
  resource_type: string;
  resource_subtype: string;
  oil_m3: number;
  gas_thousand_m3: number;
  water_m3: number;
  productive_wells: number;
  is_complete: boolean;
}

export interface ExplorerData {
  default_state: ExplorerDefaultState;
  rows: ExplorerRow[];
}

// ─────────────────────────────────────────────────────────────
// Operadores
// ─────────────────────────────────────────────────────────────
export interface OperatorRanking {
  rank: number;
  slug: string;
  name: string;
  oil_m3: number;
  gas_thousand_m3: number;
  share_oil_pct: number;
  change_mom_pct: number;
  change_yoy_pct: number;
  productive_wells: number;
}

export interface OperatorAreaMix {
  label: string;
  oil_m3: number;
  share_pct: number;
}

export interface OperatorResourceMix {
  label: string;
  value_pct: number;
}

export interface OperatorNewWell {
  period: string;
  count: number;
}

export interface OperatorProfile {
  slug: string;
  name: string;
  alias_note?: string | null;
  area_mix: OperatorAreaMix[];
  resource_mix: OperatorResourceMix[];
  new_productive_wells: OperatorNewWell[];
  cohort_ids: string[];
}

export interface OperatorsData {
  rankings: OperatorRanking[];
  profiles: OperatorProfile[];
}

// ─────────────────────────────────────────────────────────────
// Cohortes
// ─────────────────────────────────────────────────────────────
export interface CohortPoint {
  well_age_month: number;
  p25: number | null;
  median: number;
  p75: number | null;
  mean: number | null;
  well_count: number;
}

export interface CohortCurve {
  id: string;
  label: string;
  operator_slug?: string | null;
  area?: string | null;
  formation?: string | null;
  cohort_start: string;
  sample_size: number;
  metric: string;
  unit: string;
  points: CohortPoint[];
}

export interface CohortCumulativeSummary {
  cohort_id: string;
  cum_3: number | null;
  cum_6: number | null;
  cum_12: number | null;
  unit: string;
  n_3: number;
  n_6: number;
  n_12: number;
}

export interface CohortsData {
  minimum_sample_size: number;
  default_metric: string;
  curves: CohortCurve[];
  cumulative_summary: CohortCumulativeSummary[];
}

// ─────────────────────────────────────────────────────────────
// Completación / Fracturas
// ─────────────────────────────────────────────────────────────
export interface CompletionCoverage {
  production_wells: number;
  wells_with_fracture_record: number;
  matched_wells: number;
  match_rate_pct: number;
  valid_horizontal_length_pct: number;
  valid_stage_count_pct: number;
  eligible_for_normalization: number;
}

export interface CompletionBucketStat {
  dimension: string;
  bucket: string;
  well_count: number;
  p25_cum_oil_6m_m3: number | null;
  median_cum_oil_6m_m3: number | null;
  p75_cum_oil_6m_m3: number | null;
}

export interface CompletionWell {
  well_id: string;
  operator_slug: string;
  area: string;
  horizontal_length_m: number;
  stage_count: number;
  sand_tonnes?: number | null;
  water_m3?: number | null;
  cum_oil_6m_m3: number;
  oil_per_1000m_m3?: number | null;
}

export interface CompletionsData {
  coverage: CompletionCoverage;
  bucket_stats: CompletionBucketStat[];
  scatter: CompletionWell[];
  disclaimer: string;
}

// ─────────────────────────────────────────────────────────────
// Mapa
// ─────────────────────────────────────────────────────────────
export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface MapWellProperties {
  well_id: string;
  label: string;
  operator_slug: string;
  operator_name: string;
  area: string;
  formation: string;
  resource_type: string;
  well_status: string;
  last_oil_m3: number;
  last_gas_thousand_m3: number;
}

export interface TrajectoryProperties {
  well_id: string;
  operator_name: string;
  horizontal_length_m: number;
}

export interface GeoJsonFeature<P = Record<string, unknown>> {
  type: "Feature";
  geometry:
    | { type: "Point"; coordinates: number[] }
    | { type: "LineString"; coordinates: number[][] }
    | { type: string; coordinates: number[] | number[][] | number[][][] };
  properties: P | null;
}

export interface GeoJsonFeatureCollection<P = Record<string, unknown>> {
  type: "FeatureCollection";
  features: GeoJsonFeature<P>[];
}

export interface MapData {
  initial_view: MapViewState;
  color_modes: string[];
  wells_geojson: GeoJsonFeatureCollection<MapWellProperties>;
  trajectories_geojson: GeoJsonFeatureCollection<TrajectoryProperties>;
}

// ─────────────────────────────────────────────────────────────
// Calidad
// ─────────────────────────────────────────────────────────────
export interface QualityOverall {
  status: string;
  score_pct: number;
  critical_tests_failed: number;
  warnings: number;
  last_successful_run: string;
  rows_processed: number;
}

export interface QualitySource {
  source_id: string;
  name: string;
  status: string;
  source_last_modified: string;
  retrieved_at: string;
  row_count: number;
  checksum_short: string;
  revision_detected: boolean;
}

export interface QualityCheck {
  check_id: string;
  label: string;
  severity: string;
  status: string;
  affected_rows: number;
}

export interface JoinCoverageItem {
  relationship: string;
  matched: number;
  total: number;
  coverage_pct: number;
}

export interface ReconciliationRow {
  period: string;
  product: string;
  well_aggregate: number;
  control_series: number;
  unit: string;
  difference_pct: number;
}

export interface QualityRevision {
  source_id: string;
  detected_at: string;
  affected_period_start: string;
  affected_period_end: string;
  changed_rows: number;
}

export interface QualityData {
  overall: QualityOverall;
  sources: QualitySource[];
  checks: QualityCheck[];
  join_coverage: JoinCoverageItem[];
  reconciliation: ReconciliationRow[];
  revisions: QualityRevision[];
}

// ─────────────────────────────────────────────────────────────
// Descargas, metodología y releases
// ─────────────────────────────────────────────────────────────
export interface DownloadArtifact {
  id: string;
  title: string;
  description: string;
  format: string;
  url: string;
  size_bytes: number;
  updated_at: string;
}

export interface MethodologyDefinition {
  id: string;
  term: string;
  definition: string;
}

export interface MethodologySource {
  source_id: string;
  name: string;
  publisher: string;
  url: string;
  license: string;
}

export interface MethodologyData {
  definitions: MethodologyDefinition[];
  sources: MethodologySource[];
  caveats: string[];
}

export interface ReleaseHistoryItem {
  release_id: string;
  data_cutoff: string;
  published_at: string;
  status: ReleaseStatus;
  is_current: boolean;
}
