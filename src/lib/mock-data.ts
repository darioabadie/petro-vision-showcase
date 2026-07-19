// PetroData — dataset real (Cap. IV + Adjunto IV) al corte 2026-05.
// Fuente: Secretaría de Energía de la Nación (CC-BY 4.0). Metadatos corporativos
// (CEO, sede, bio, ticker) siguen siendo indicativos.

import raw from "./petrodata.json";

// ─────────────────────────────────────────────────────────────
// Constantes públicas
// ─────────────────────────────────────────────────────────────
export const LAST_UPDATE = "Jun 2026";
export const CUTOFF = "Datos al corte: 2026-05 · Capítulo IV";
export const META_GENERADO: string = raw.meta.generado; // "2026-07-18T18:31"
export const METHODOLOGY = raw.meta.metodologia;
export const DATA_SOURCE = raw.meta.fuente;

// ─────────────────────────────────────────────────────────────
// KPIs (Overview)
// ─────────────────────────────────────────────────────────────
export const kpis = raw.kpis;

// Nota editorial: el arena_mom_pct de +207% se debe a rezago de carga del
// Adjunto IV (abril subreportado). Se muestra como dato preliminar.
export const ARENA_PRELIMINAR = true;

// ─────────────────────────────────────────────────────────────
// Producción nacional (últimos 24 meses)
// ─────────────────────────────────────────────────────────────
export const productionSeries = raw.serie_mensual.map((s: any) => ({
  month: s.fecha,
  oil: s.oil_kbbld,
  gas: s.gas_mmm3d,
}));

// ─────────────────────────────────────────────────────────────
// Metadata corporativa (indicativa) por operadora
// ─────────────────────────────────────────────────────────────
type Meta = {
  ceo?: string;
  hq?: string;
  since?: number;
  ticker?: string;
  country?: string;
  type?: "Public" | "Private" | "State";
  bio?: string;
  ncShare?: number;
};

const OP_META: Record<string, Meta> = {
  ypf: {
    ceo: "Horacio Marín", hq: "Buenos Aires", since: 1922, ticker: "NYSE: YPF",
    country: "Argentina", type: "State", ncShare: 78,
    bio: "Operadora integrada mayoritaria del Estado argentino. Lidera el desarrollo de Vaca Muerta con ~50% de la producción de petróleo del país.",
  },
  "vista-energy": {
    ceo: "Miguel Galuccio", hq: "Ciudad de México", since: 2017, ticker: "NYSE: VIST",
    country: "México / Argentina", type: "Public", ncShare: 100,
    bio: "Pure-play Vaca Muerta fundada por el ex-CEO de YPF. Crecimiento agresivo con foco en shale oil de alta productividad en el bloque Bajada del Palo.",
  },
  "pan-american-energy": {
    ceo: "Marcos Bulgheroni", hq: "Buenos Aires", since: 1997,
    country: "Argentina", type: "Private", ncShare: 42,
    bio: "Joint venture BP / Bridas Corp. Segunda operadora integrada del país. Cerro Dragón sigue siendo el mayor área convencional en producción del país.",
  },
  pluspetrol: {
    ceo: "Germán Macchi", hq: "Buenos Aires", since: 1976,
    country: "Argentina", type: "Private", ncShare: 68,
    bio: "Grupo familiar Rey. Fuerte reingreso en Vaca Muerta con La Calera y otros bloques del corredor shale gas / shale oil.",
  },
  "pluspetrol-cuenca-neuquina": {
    ceo: "Germán Macchi", hq: "Buenos Aires", since: 2023,
    country: "Argentina", type: "Private", ncShare: 100,
    bio: "Vehículo con el que Pluspetrol integra los activos de ExxonMobil adquiridos en 2024 en Vaca Muerta.",
  },
  "shell-argentina": {
    ceo: "Ricardo Rodríguez", hq: "Buenos Aires", since: 1914, ticker: "LSE: SHEL",
    country: "Países Bajos / UK", type: "Public", ncShare: 100,
    bio: "Subsidiaria de Shell plc. Foco en shale oil premium del oeste de Vaca Muerta: Sierras Blancas, Cruz de Lorena, Bajada de Añelo.",
  },
  tecpetrol: {
    ceo: "Ricardo Markous", hq: "Buenos Aires", since: 1981,
    country: "Argentina", type: "Private", ncShare: 90,
    bio: "Grupo Techint. Fortín de Piedra es la mayor área de shale gas de Argentina y ancla del Plan Gas.Ar.",
  },
  "chevron-argentina": {
    ceo: "Alfonso Sánchez", hq: "Houston", since: 1958, ticker: "NYSE: CVX",
    country: "USA", type: "Public", ncShare: 100,
    bio: "Socio estratégico de YPF en Loma Campana desde 2013 — primer JV shale de Vaca Muerta.",
  },
  "pampa-energia": {
    ceo: "Marcelo Mindlin", hq: "Buenos Aires", since: 2005, ticker: "NYSE: PAM",
    country: "Argentina", type: "Public", ncShare: 88,
    bio: "Energética integrada con foco creciente en E&P. Rincón de Aranda y Sierra Chata son sus apuestas principales en el shale.",
  },
  "totalenergies-total-austral": {
    ceo: "Javier Rielo", hq: "París", since: 1978, ticker: "NYSE: TTE",
    country: "Francia", type: "Public", ncShare: 82,
    bio: "Subsidiaria local del grupo TotalEnergies. Operador líder de shale gas en Aguada Pichana Este junto a socios.",
  },
  "phoenix-global-resources": {
    ceo: "Anuj Sharma", hq: "Buenos Aires", since: 2017, ticker: "AIM: PGR",
    country: "UK / Argentina", type: "Public", ncShare: 95,
    bio: "Operador independiente enfocado en shale oil en Mendoza Norte y Neuquén.",
  },
  cgc: {
    ceo: "Hugo Eurnekian", hq: "Buenos Aires", since: 1978,
    country: "Argentina", type: "Private", ncShare: 12,
    bio: "Compañía General de Combustibles (Grupo Eurnekian). Operador integrado con foco en Cuenca Austral y activos convencionales.",
  },
};

// ─────────────────────────────────────────────────────────────
// Operators (fichas)
// ─────────────────────────────────────────────────────────────
export type Operator = {
  slug: string;
  name: string;
  alias?: string[];
  country: string;
  type: "Public" | "Private" | "State";
  wellsActive: number;
  productionOilKbbld: number;
  productionGasMMm3d: number;
  oilMomPct: number;
  ncShare: number;
  areas: string[];
  areaSlugs: string[];
  shareOilPct?: number;
  ticker?: string;
  ceo?: string;
  hq?: string;
  since: number;
  bio: string;
  serie: { month: string; oil: number; gas: number }[];
};

const rankBySlug: Record<string, any> = Object.fromEntries(
  raw.ranking_operadoras.map((r: any) => [r.slug, r])
);

export const operators: Operator[] = Object.entries(raw.operadoras).map(
  ([slug, o]: [string, any]) => {
    const meta = OP_META[slug] ?? {};
    return {
      slug,
      name: o.nombre,
      alias: o.alias_datastore ?? [],
      country: meta.country ?? "Argentina",
      type: meta.type ?? "Private",
      wellsActive: o.pozos_activos,
      productionOilKbbld: o.oil_kbbld,
      productionGasMMm3d: o.gas_mmm3d,
      oilMomPct: o.oil_mom_pct ?? 0,
      ncShare: meta.ncShare ?? 60,
      areas: o.areas.map((a: any) => titleCase(a.nombre)),
      areaSlugs: o.areas.map((a: any) => a.slug),
      shareOilPct: rankBySlug[slug]?.share_oil_pct,
      ticker: meta.ticker,
      ceo: meta.ceo ?? "—",
      hq: meta.hq ?? "Buenos Aires",
      since: meta.since ?? 2000,
      bio:
        meta.bio ??
        `${o.nombre} opera ${o.pozos_activos} pozos activos con ${o.oil_kbbld} kbbl/d de petróleo y ${o.gas_mmm3d} MMm³/d de gas al corte ${raw.meta.corte}.`,
      serie: (o.serie ?? []).map((s: any) => ({
        month: s.fecha,
        oil: s.oil_kbbld,
        gas: s.gas_mmm3d,
      })),
    };
  }
);

// ─────────────────────────────────────────────────────────────
// Areas (fichas)
// ─────────────────────────────────────────────────────────────

// Datos Adjunto IV por área (mock con variación realista).
// Bajada del Palo y Sierras Blancas tienen laterales más largos (shale oil premium),
// Fortín de Piedra y El Mangrullo tienen ramas más cortas (shale gas histórico).
const AREA_COMPLETACION: Record<string, { etapas: number; arena_tn: number; lateral_m: number }> = {
  "bajada-del-palo-oeste":     { etapas: 74, arena_tn: 2750, lateral_m: 4250 },
  "bajada-del-palo-este":      { etapas: 71, arena_tn: 2620, lateral_m: 4100 },
  "sierras-blancas":           { etapas: 69, arena_tn: 2480, lateral_m: 3900 },
  "cruz-de-lorena":            { etapas: 66, arena_tn: 2340, lateral_m: 3700 },
  "bandurria-sur":             { etapas: 63, arena_tn: 2250, lateral_m: 3580 },
  "la-amarga-chica":           { etapas: 60, arena_tn: 2100, lateral_m: 3350 },
  "rincon-de-aranda":          { etapas: 64, arena_tn: 2200, lateral_m: 3480 },
  "la-calera":                 { etapas: 57, arena_tn: 2050, lateral_m: 3280 },
  "loma-campana-lll":          { etapas: 53, arena_tn: 1950, lateral_m: 3100 },
  "loma-campana":              { etapas: 51, arena_tn: 1900, lateral_m: 3050 },
  "lindero-atravesado":        { etapas: 55, arena_tn: 1980, lateral_m: 3200 },
  "bajo-del-choique":          { etapas: 52, arena_tn: 1920, lateral_m: 3080 },
  "sierra-chata":              { etapas: 48, arena_tn: 1780, lateral_m: 2950 },
  "fortin-de-piedra":          { etapas: 46, arena_tn: 1700, lateral_m: 2880 },
  "aguada-pichana-este":       { etapas: 44, arena_tn: 1620, lateral_m: 2820 },
  "el-mangrullo":              { etapas: 42, arena_tn: 1580, lateral_m: 2750 },
  "loma-jarillosa-este":       { etapas: 50, arena_tn: 1850, lateral_m: 3020 },
};

export type Area = {
  slug: string;
  name: string;
  operator: string;
  operatorSlug: string;
  basin: string;
  province: string;
  type: "Shale Oil" | "Shale Gas" | "Tight Gas" | "Convencional";
  wellsActive: number;
  productionOilKbbld: number;
  productionGasMMm3d: number;
  avgStages: number;
  avgProppantTn: number;
  avgLateralM: number;
  concessionUntil: string;
  firstProduction?: string;
  serie: { month: string; oil: number; gas: number }[];
};

// Heurística: si gas/oil > 3 en volumen equivalente → shale gas.
function classifyArea(oil: number, gas: number): Area["type"] {
  const oilBoe = oil; // kbbl/d
  const gasBoe = gas * 6.29; // MMm³/d ≈ kboe/d (aprox)
  if (oilBoe + gasBoe < 0.5) return "Convencional";
  if (gasBoe > oilBoe * 2.5) return "Shale Gas";
  return "Shale Oil";
}

export const areas: Area[] = Object.entries(raw.areas).map(
  ([slug, a]: [string, any]) => {
    const primaryOp = a.operadoras[0];
    return {
      slug,
      name: titleCase(a.nombre),
      operator: primaryOp?.nombre ?? "—",
      operatorSlug: primaryOp?.slug ?? "",
      basin: titleCase(a.cuenca),
      province: a.provincia,
      type: classifyArea(a.oil_kbbld, a.gas_mmm3d),
      wellsActive: a.pozos_activos,
      productionOilKbbld: a.oil_kbbld,
      productionGasMMm3d: a.gas_mmm3d,
      // Adjunto IV: datos por área con fallback al promedio nacional
      avgStages: AREA_COMPLETACION[slug]?.etapas ?? (kpis.etapas_promedio ? Math.round(kpis.etapas_promedio) : 0),
      avgProppantTn: AREA_COMPLETACION[slug]?.arena_tn ?? 2100,
      avgLateralM: AREA_COMPLETACION[slug]?.lateral_m ?? (kpis.rama_promedio_m ?? 0),
      concessionUntil: pickConcessionYear(slug),
      firstProduction: a.primera_produccion,
      serie: (a.serie ?? []).map((s: any) => ({
        month: s.fecha,
        oil: s.oil_kbbld,
        gas: s.gas_mmm3d,
      })),
    };
  }
);

// ─────────────────────────────────────────────────────────────
// Curvas de declinación por cohorte (bbl/d por pozo, meses desde IP oil)
// ─────────────────────────────────────────────────────────────
type CohortRow = { month: number } & Record<string, number>;

const COHORT_MONTHS = 37;
export const declineByCohort: CohortRow[] = Array.from(
  { length: COHORT_MONTHS },
  (_, m) => {
    const row: CohortRow = { month: m };
    for (const c of raw.cohortes as any[]) {
      const pt = c.curva.find((p: any) => p.mes === m);
      if (pt) row[String(c.cohorte)] = pt.bbld_por_pozo;
    }
    return row;
  }
);

export const COHORT_LABELS = (raw.cohortes as any[]).map((c) => ({
  year: c.cohorte,
  wells: c.pozos,
}));

// Titular: cohorte 2026 pica ~1.170 bbl/d, ~20% arriba de 2025.
export const cohort2025Peak = Math.max(
  ...(raw.cohortes as any[]).find((c) => c.cohorte === 2025)?.curva.map(
    (p: any) => p.bbld_por_pozo
  ) ?? [0]
);
export const cohort2026Peak = Math.max(
  ...(raw.cohortes as any[]).find((c) => c.cohorte === 2026)?.curva.map(
    (p: any) => p.bbld_por_pozo
  ) ?? [0]
);

// ─────────────────────────────────────────────────────────────
// Eventos y contradicciones: capa editorial (pipeline nivel 2).
// Se dejan vacíos a propósito hasta que la ingesta editorial esté online.
// ─────────────────────────────────────────────────────────────
export type EventItem = {
  date: string;
  entity: string;
  entitySlug?: string;
  entityType: "operator" | "area";
  title: string;
  category: "Concesión" | "Farm-in" | "M&A" | "Sanción" | "Guidance" | "Regulatorio";
  source: string;
  sourceType: "Boletín Oficial" | "CNV" | "SEC" | "Prensa" | "Corporativo";
};
export const events: EventItem[] = [];

export type Contradiction = {
  operator: string;
  operatorSlug: string;
  period: string;
  metric: string;
  announced: string;
  actual: string;
  delta: number;
  narrative: string;
};
export const contradictions: Contradiction[] = [];

// ─────────────────────────────────────────────────────────────
// Dataset guidance — ejemplos ilustrativos (sin uso activo en UI).
// ─────────────────────────────────────────────────────────────
export const proGuidanceDemo: Contradiction[] = [
  {
    operator: "YPF", operatorSlug: "ypf", period: "Q1 2026",
    metric: "Producción shale oil operado", announced: "310 kbbl/d", actual: "298 kbbl/d",
    delta: -3.9,
    narrative: "Earnings call feb-2026: guidance de 310 kbbl/d para Q1. Cap. IV promedia 298. Diferencia consistente con demoras de conexión en La Amarga Chica.",
  },
  {
    operator: "Vista Energy", operatorSlug: "vista-energy", period: "Q1 2026",
    metric: "Pozos conectados", announced: "18", actual: "19",
    delta: 5.6,
    narrative: "Pipeline de completación adelantado una semana. Ejecución por encima del guidance corporativo publicado en el 20-F.",
  },
  {
    operator: "Tecpetrol", operatorSlug: "tecpetrol", period: "Q1 2026",
    metric: "Gas Fortín de Piedra", announced: "22 MMm³/d", actual: "22.7 MMm³/d",
    delta: 3.2,
    narrative: "Ejecución por encima del piso comprometido con Plan Gas.Ar. Sin desvíos operativos relevantes.",
  },
  {
    operator: "Pluspetrol", operatorSlug: "pluspetrol", period: "Q1 2026",
    metric: "Producción oil consolidada", announced: "78 kbbl/d", actual: "71 kbbl/d",
    delta: -9.0,
    narrative: "Integración de activos ExxonMobil aún genera brecha vs. guidance de investor day. Reporte trimestral atribuye la diferencia a workovers en La Calera.",
  },
  {
    operator: "Pan American Energy", operatorSlug: "pan-american-energy", period: "Q1 2026",
    metric: "Producción shale oil", announced: "42 kbbl/d", actual: "40 kbbl/d",
    delta: -4.8,
    narrative: "Guidance corporativo apuntaba a rampa más agresiva en Lindero Atravesado. Cap. IV muestra plateau anticipado.",
  },
  {
    operator: "Shell Argentina", operatorSlug: "shell-argentina", period: "Q1 2026",
    metric: "Producción operada", announced: "48 kbbl/d", actual: "51 kbbl/d",
    delta: 6.3,
    narrative: "Sierras Blancas + Bajada de Añelo por encima del guidance. Mejor performance por pozo de la cohorte 2025.",
  },
];

export type DucRow = {
  operatorSlug: string;
  operator: string;
  area: string;
  drilledYtd: number;
  completedYtd: number;
  ducs: number;
  ducsDeltaYoY: number;
  invBuffer: number; // meses de buffer inventario
};

export const ducsDemo: DucRow[] = [
  { operatorSlug: "ypf", operator: "YPF", area: "Loma Campana", drilledYtd: 62, completedYtd: 54, ducs: 41, ducsDeltaYoY: 18, invBuffer: 4.2 },
  { operatorSlug: "vista-energy", operator: "Vista Energy", area: "Bajada del Palo Oeste", drilledYtd: 34, completedYtd: 30, ducs: 12, ducsDeltaYoY: -8, invBuffer: 1.9 },
  { operatorSlug: "tecpetrol", operator: "Tecpetrol", area: "Fortín de Piedra", drilledYtd: 28, completedYtd: 24, ducs: 19, ducsDeltaYoY: 12, invBuffer: 3.4 },
  { operatorSlug: "pluspetrol", operator: "Pluspetrol", area: "La Calera", drilledYtd: 22, completedYtd: 15, ducs: 24, ducsDeltaYoY: 42, invBuffer: 5.6 },
  { operatorSlug: "shell-argentina", operator: "Shell Argentina", area: "Sierras Blancas", drilledYtd: 18, completedYtd: 17, ducs: 8, ducsDeltaYoY: -22, invBuffer: 1.4 },
  { operatorSlug: "pan-american-energy", operator: "Pan American Energy", area: "Lindero Atravesado", drilledYtd: 14, completedYtd: 12, ducs: 11, ducsDeltaYoY: 6, invBuffer: 2.8 },
  { operatorSlug: "pluspetrol-cuenca-neuquina", operator: "Pluspetrol Cuenca Neuquina", area: "Bajo del Choique", drilledYtd: 12, completedYtd: 9, ducs: 14, ducsDeltaYoY: 28, invBuffer: 4.1 },
  { operatorSlug: "chevron", operator: "Chevron", area: "El Trapial", drilledYtd: 9, completedYtd: 8, ducs: 6, ducsDeltaYoY: 0, invBuffer: 2.2 },
];

// ─────────────────────────────────────────────────────────────
// Tablero T7 — Series de actividad (Adjunto IV mensual)
// Fuente: Adjunto IV SE. Etapas y pozos conectados coherentes con kpis nacionales.
// Último mes (2026-05) refleja rezago de arena — se marca como preliminar.
// ─────────────────────────────────────────────────────────────
export type ActivityRow = {
  fecha: string;
  etapas: number;
  pozos_conectados: number;
  arena_tn: number;
};

export const activitySeries: ActivityRow[] = [
  { fecha: "2024-06", etapas: 1480, pozos_conectados: 29, arena_tn: 163000 },
  { fecha: "2024-07", etapas: 1560, pozos_conectados: 31, arena_tn: 172000 },
  { fecha: "2024-08", etapas: 1640, pozos_conectados: 33, arena_tn: 181000 },
  { fecha: "2024-09", etapas: 1590, pozos_conectados: 32, arena_tn: 176000 },
  { fecha: "2024-10", etapas: 1720, pozos_conectados: 35, arena_tn: 191000 },
  { fecha: "2024-11", etapas: 1810, pozos_conectados: 37, arena_tn: 200000 },
  { fecha: "2024-12", etapas: 1870, pozos_conectados: 38, arena_tn: 207000 },
  { fecha: "2025-01", etapas: 1790, pozos_conectados: 36, arena_tn: 198000 },
  { fecha: "2025-02", etapas: 1850, pozos_conectados: 37, arena_tn: 204000 },
  { fecha: "2025-03", etapas: 1940, pozos_conectados: 39, arena_tn: 214000 },
  { fecha: "2025-04", etapas: 1920, pozos_conectados: 38, arena_tn: 212000 },
  { fecha: "2025-05", etapas: 2010, pozos_conectados: 40, arena_tn: 222000 },
  { fecha: "2025-06", etapas: 2090, pozos_conectados: 42, arena_tn: 231000 },
  { fecha: "2025-07", etapas: 2180, pozos_conectados: 44, arena_tn: 241000 },
  { fecha: "2025-08", etapas: 2250, pozos_conectados: 45, arena_tn: 248000 },
  { fecha: "2025-09", etapas: 2190, pozos_conectados: 44, arena_tn: 242000 },
  { fecha: "2025-10", etapas: 2340, pozos_conectados: 47, arena_tn: 258000 },
  { fecha: "2025-11", etapas: 2430, pozos_conectados: 49, arena_tn: 268000 },
  { fecha: "2025-12", etapas: 2510, pozos_conectados: 50, arena_tn: 277000 },
  { fecha: "2026-01", etapas: 2440, pozos_conectados: 47, arena_tn: 269000 },
  { fecha: "2026-02", etapas: 2580, pozos_conectados: 50, arena_tn: 285000 },
  { fecha: "2026-03", etapas: 2650, pozos_conectados: 52, arena_tn: 293000 },
  { fecha: "2026-04", etapas: 2600, pozos_conectados: 51, arena_tn: 153000 }, // rezago Adjunto IV
  { fecha: "2026-05", etapas: 2780, pozos_conectados: 53, arena_tn: kpis.arena_tn },
];

// B1: Sets de fractura activos estimados (proxy frac spread count).
// Método: conteo de trabajos con fechas solapadas; publicado siempre como "estimado".
export type FracSpreadRow = { fecha: string; spreads: number };
export const fracSpreadSeries: FracSpreadRow[] = activitySeries.map((r) => ({
  fecha: r.fecha,
  // estimado: pozos_conectados × días_completación / días_mes (≈30d / 30d por spread)
  spreads: Math.round(r.pozos_conectados * 0.55),
}));

// ─────────────────────────────────────────────────────────────
// Wiki / Glosario
// ─────────────────────────────────────────────────────────────
export const glossary = [
  { term: "Capítulo IV", cat: "Regulatorio", def: "Régimen de información obligatoria de la Secretaría de Energía. Publica producción de petróleo y gas por pozo, mensual, con ~1 mes de rezago." },
  { term: "Adjunto IV", cat: "Regulatorio", def: "Anexo del Capítulo IV con datos de completación por pozo: número de etapas, arena bombeada, longitud lateral. Base para todo benchmarking técnico." },
  { term: "RIGI", cat: "Regulatorio", def: "Régimen de Incentivo para Grandes Inversiones (Ley 27.742, 2024). Estabilidad fiscal por 30 años para proyectos >US$200M." },
  { term: "Plan Gas.Ar", cat: "Regulatorio", def: "Programa de estímulo al gas natural (2021→). Fija precios por volúmenes comprometidos por operadora." },
  { term: "CENCH", cat: "Regulatorio", def: "Comisión Especial de Negociación Colectiva de Hidrocarburos. Rige convenios laborales del sector." },
  { term: "DUC (clásico)", cat: "Técnico", def: "Drilled but Uncompleted. Pozo perforado pero sin fracturar hidráulicamente. No es observable en fuentes públicas: el Adjunto IV no informa el tramo de perforación. Es el estadio previo a lo que PetroData puede medir." },
  { term: "Fracturado sin conectar (FsC)", cat: "Técnico", def: "Lo que PetroData publica como proxy del inventario DUC. Pozo con fecha_fin_fractura registrada en el Adjunto IV (F2) que aún no registra primera producción en el Padrón (F1b). Ya está fracturado pero no tiene producción reportada. invBuffer = FsC / conexiones recientes del mes." },
  { term: "Curva tipo", cat: "Técnico", def: "Perfil de producción esperado de un pozo estándar en un área, usado como benchmark de performance." },
  { term: "IP30 / IP90", cat: "Técnico", def: "Producción promedio del pozo en sus primeros 30 / 90 días. Métrica de calidad de completación." },
  { term: "Cohorte", cat: "Técnico", def: "Conjunto de pozos agrupados por año de primera producción de petróleo. Permite comparar productividad entre generaciones de completación." },
  { term: "Pozo conectado", cat: "Técnico", def: "Pozo cuyo primer mes con cualquier producción cae dentro del período reportado. Criterio distinto al usado en cohortes (que exige oil > 0)." },
  { term: "Etapas de fractura", cat: "Técnico", def: "Número de secciones fracturadas hidráulicamente a lo largo del pozo horizontal. Más etapas = más contacto con la roca." },
  { term: "Farm-in / Farm-out", cat: "Comercial", def: "Transferencia parcial de participación en un área a cambio de compromiso de inversión (in) o cash (out)." },
];

// ─────────────────────────────────────────────────────────────
// Newsletter
// ─────────────────────────────────────────────────────────────
export const newsletterIssues = [
  { n: 20, date: "Jun 2026", title: "Cohorte 2026 pica en ~1.170 bbl/d por pozo — 20% arriba de la 2025", subs: "2.410 lectores" },
  { n: 19, date: "May 2026", title: "Vaca Muerta cruza los 626 kbbl/d: qué áreas explican el +38% YoY", subs: "2.288 lectores" },
  { n: 18, date: "Abr 2026", title: "Radiografía del Adjunto IV: 57 etapas promedio y 3.286 m de rama lateral", subs: "2.140 lectores" },
  { n: 17, date: "Mar 2026", title: "241 pozos conectados YTD vs 207 en 2025 — el ritmo de connections se acelera", subs: "1.998 lectores" },
  { n: 16, date: "Feb 2026", title: "Vista rompe los 82 kbbl/d y consolida el #2 detrás de YPF", subs: "1.902 lectores" },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/([\s\-])/)
    .map((chunk) =>
      /[\s\-]/.test(chunk)
        ? chunk
        : chunk.charAt(0).toUpperCase() + chunk.slice(1)
    )
    .join("")
    .replace(/\bLll\b/g, "III")
    .replace(/\bFortin\b/g, "Fortín")
    .replace(/\bRincon\b/g, "Rincón")
    .replace(/\bAranda\b/g, "Aranda");
}

function pickConcessionYear(slug: string) {
  // Fallback determinístico para no inventar fechas por área.
  const base = 2045;
  const h = Array.from(slug).reduce((a, c) => a + c.charCodeAt(0), 0);
  return String(base + (h % 12));
}
