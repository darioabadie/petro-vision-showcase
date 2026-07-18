// Mock data para PetroData — MVP demo (todos los números son ficticios pero plausibles)

export const LAST_UPDATE = "Nov 2025";
export const CUTOFF = "Datos al corte: 2025-10 · Capítulo IV";

export type Operator = {
  slug: string;
  name: string;
  alias?: string[];
  country: string;
  type: "Public" | "Private" | "State";
  wellsActive: number;
  productionOilKbbld: number; // kbbl/d
  productionGasMMm3d: number; // MMm3/d
  ncShare: number; // % producción no convencional
  areas: string[];
  ticker?: string;
  ceo?: string;
  hq?: string;
  since: number;
  bio: string;
  history: { date: string; type: "concession" | "farmin" | "mna" | "sanction" | "guidance"; title: string; source: string }[];
};

export const operators: Operator[] = [
  {
    slug: "ypf",
    name: "YPF",
    alias: ["YPF S.A.", "Yacimientos Petrolíferos Fiscales"],
    country: "Argentina",
    type: "State",
    wellsActive: 1284,
    productionOilKbbld: 142.6,
    productionGasMMm3d: 41.2,
    ncShare: 68,
    areas: ["Loma Campana", "La Amarga Chica", "Bandurria Sur", "Aguada del Chañar"],
    ticker: "NYSE: YPF",
    ceo: "Horacio Marín",
    hq: "Buenos Aires",
    since: 1922,
    bio: "Operadora integrada mayoritaria del Estado argentino. Lidera el desarrollo de Vaca Muerta con ~40% de la producción no convencional nacional.",
    history: [
      { date: "2025-10-14", type: "guidance", title: "Guidance Q4: 165 pozos conectados", source: "Earnings call Q3 2025" },
      { date: "2025-09-02", type: "mna", title: "Cesión de 14 áreas convencionales a operadoras regionales", source: "CNV hecho relevante" },
      { date: "2025-07-18", type: "concession", title: "Prórroga concesión Loma Campana +10 años", source: "Boletín Oficial Neuquén" },
      { date: "2025-05-30", type: "farmin", title: "Farm-in con Chevron en Aguada del Chañar", source: "Comunicado corporativo" },
    ],
  },
  {
    slug: "vista",
    name: "Vista Energy",
    alias: ["Vista Oil & Gas", "Vista Argentina"],
    country: "México / Argentina",
    type: "Public",
    wellsActive: 214,
    productionOilKbbld: 84.1,
    productionGasMMm3d: 6.4,
    ncShare: 100,
    areas: ["Bajada del Palo Oeste", "Bajada del Palo Este", "Águila Mora"],
    ticker: "NYSE: VIST",
    ceo: "Miguel Galuccio",
    hq: "Ciudad de México",
    since: 2017,
    bio: "Pure-play Vaca Muerta. Fundada por ex-CEO de YPF. Crecimiento agresivo con foco en shale oil de alta productividad.",
    history: [
      { date: "2025-10-28", type: "guidance", title: "Upgrade guidance 2025: 95→105 kbbl/d", source: "Earnings call Q3 2025" },
      { date: "2025-08-11", type: "mna", title: "Adquisición pad-adjacent a Petronas", source: "SEC 6-K filing" },
      { date: "2025-04-03", type: "concession", title: "RIGI aprobado — proyecto oleoducto VMOS", source: "Decreto 274/2025" },
    ],
  },
  {
    slug: "pan-american",
    name: "Pan American Energy",
    alias: ["PAE", "Pan American Sur"],
    country: "Argentina",
    type: "Private",
    wellsActive: 892,
    productionOilKbbld: 105.3,
    productionGasMMm3d: 18.7,
    ncShare: 38,
    areas: ["Lindero Atravesado", "Coirón Amargo Sur Este", "Cerro Dragón"],
    ceo: "Marcos Bulgheroni",
    hq: "Buenos Aires",
    since: 1997,
    bio: "Joint venture BP / Bridas Corp. Segunda operadora integrada del país. Cerro Dragón sigue siendo el mayor área convencional en producción.",
    history: [
      { date: "2025-09-19", type: "farmin", title: "Farm-in 40% en Coirón Amargo Sur Este", source: "Boletín Oficial Neuquén" },
      { date: "2025-06-04", type: "guidance", title: "Capex 2026: US$1.8B (+22% YoY)", source: "Comunicado corporativo" },
    ],
  },
  {
    slug: "pluspetrol",
    name: "Pluspetrol",
    alias: ["Pluspetrol S.A.", "Pluspetrol Energy"],
    country: "Argentina",
    type: "Private",
    wellsActive: 421,
    productionOilKbbld: 48.9,
    productionGasMMm3d: 12.1,
    ncShare: 55,
    areas: ["La Calera", "El Trapial", "Centenario"],
    ceo: "Germán Macchi",
    hq: "Buenos Aires",
    since: 1976,
    bio: "Grupo familiar Rey. Reingreso fuerte en Vaca Muerta post-adquisición de activos de ExxonMobil (2024).",
    history: [
      { date: "2025-10-02", type: "mna", title: "Cierre adquisición activos ExxonMobil Argentina", source: "CNV hecho relevante" },
      { date: "2025-08-25", type: "sanction", title: "Multa Ente Provincial por derrame Centenario", source: "Boletín Oficial Neuquén" },
    ],
  },
  {
    slug: "shell",
    name: "Shell Argentina",
    country: "Países Bajos / UK",
    type: "Public",
    wellsActive: 118,
    productionOilKbbld: 41.2,
    productionGasMMm3d: 3.1,
    ncShare: 100,
    areas: ["Sierras Blancas", "Cruz de Lorena", "Coirón Amargo Sur Oeste"],
    ticker: "LSE: SHEL",
    ceo: "Ricardo Rodríguez",
    hq: "Buenos Aires",
    since: 1914,
    bio: "Subsidiaria de Shell plc. Operador focalizado en shale oil premium del oeste de Vaca Muerta.",
    history: [
      { date: "2025-07-22", type: "concession", title: "Extensión Sierras Blancas hasta 2055", source: "Boletín Oficial Neuquén" },
    ],
  },
  {
    slug: "tecpetrol",
    name: "Tecpetrol",
    country: "Argentina",
    type: "Private",
    wellsActive: 187,
    productionOilKbbld: 14.3,
    productionGasMMm3d: 28.4,
    ncShare: 92,
    areas: ["Fortín de Piedra", "Los Toldos II Este"],
    ceo: "Ricardo Markous",
    hq: "Buenos Aires",
    since: 1981,
    bio: "Grupo Techint. Fortín de Piedra es la mayor área de shale gas de Argentina.",
    history: [
      { date: "2025-09-08", type: "guidance", title: "Plan Gas.Ar Ronda 3 — 15 MMm³/d comprometidos", source: "Comunicado corporativo" },
    ],
  },
  {
    slug: "chevron",
    name: "Chevron Argentina",
    country: "USA",
    type: "Public",
    wellsActive: 302,
    productionOilKbbld: 62.7,
    productionGasMMm3d: 5.9,
    ncShare: 100,
    areas: ["Loma Campana (JV YPF)", "El Trapial"],
    ticker: "NYSE: CVX",
    ceo: "N/D",
    hq: "Houston",
    since: 1958,
    bio: "Socio estratégico de YPF en Loma Campana desde 2013 — primer JV shale de Vaca Muerta.",
    history: [
      { date: "2025-05-30", type: "farmin", title: "Farm-in Aguada del Chañar con YPF", source: "Comunicado corporativo" },
    ],
  },
  {
    slug: "pampa",
    name: "Pampa Energía",
    country: "Argentina",
    type: "Public",
    wellsActive: 96,
    productionOilKbbld: 6.8,
    productionGasMMm3d: 11.9,
    ncShare: 88,
    areas: ["El Mangrullo", "Sierra Chata", "Rincón de Aranda"],
    ticker: "NYSE: PAM",
    ceo: "Marcelo Mindlin",
    hq: "Buenos Aires",
    since: 2005,
    bio: "Energética integrada. Rincón de Aranda es su bet principal en shale oil.",
    history: [
      { date: "2025-06-15", type: "concession", title: "Aprobación desarrollo Rincón de Aranda", source: "Boletín Oficial Neuquén" },
    ],
  },
];

export type Area = {
  slug: string;
  name: string;
  operator: string;
  basin: string;
  type: "Shale Oil" | "Shale Gas" | "Tight Gas" | "Convencional";
  wellsActive: number;
  productionOilKbbld: number;
  productionGasMMm3d: number;
  avgStages: number;
  avgProppantTn: number;
  avgLateralM: number;
  concessionUntil: string;
};

export const areas: Area[] = [
  { slug: "loma-campana", name: "Loma Campana", operator: "YPF", basin: "Neuquina", type: "Shale Oil", wellsActive: 428, productionOilKbbld: 62.4, productionGasMMm3d: 8.1, avgStages: 42, avgProppantTn: 1820, avgLateralM: 2650, concessionUntil: "2048" },
  { slug: "bajada-del-palo-oeste", name: "Bajada del Palo Oeste", operator: "Vista Energy", basin: "Neuquina", type: "Shale Oil", wellsActive: 148, productionOilKbbld: 71.8, productionGasMMm3d: 5.2, avgStages: 48, avgProppantTn: 2140, avgLateralM: 3100, concessionUntil: "2050" },
  { slug: "fortin-de-piedra", name: "Fortín de Piedra", operator: "Tecpetrol", basin: "Neuquina", type: "Shale Gas", wellsActive: 142, productionOilKbbld: 1.2, productionGasMMm3d: 21.4, avgStages: 38, avgProppantTn: 1650, avgLateralM: 2400, concessionUntil: "2054" },
  { slug: "sierras-blancas", name: "Sierras Blancas", operator: "Shell Argentina", basin: "Neuquina", type: "Shale Oil", wellsActive: 62, productionOilKbbld: 24.1, productionGasMMm3d: 1.6, avgStages: 46, avgProppantTn: 2010, avgLateralM: 2900, concessionUntil: "2055" },
  { slug: "la-amarga-chica", name: "La Amarga Chica", operator: "YPF", basin: "Neuquina", type: "Shale Oil", wellsActive: 184, productionOilKbbld: 38.2, productionGasMMm3d: 4.8, avgStages: 44, avgProppantTn: 1920, avgLateralM: 2750, concessionUntil: "2049" },
  { slug: "el-trapial", name: "El Trapial", operator: "Chevron", basin: "Neuquina", type: "Shale Oil", wellsActive: 118, productionOilKbbld: 32.4, productionGasMMm3d: 2.9, avgStages: 40, avgProppantTn: 1780, avgLateralM: 2600, concessionUntil: "2047" },
  { slug: "la-calera", name: "La Calera", operator: "Pluspetrol", basin: "Neuquina", type: "Shale Gas", wellsActive: 88, productionOilKbbld: 3.4, productionGasMMm3d: 9.8, avgStages: 36, avgProppantTn: 1580, avgLateralM: 2350, concessionUntil: "2051" },
  { slug: "rincon-de-aranda", name: "Rincón de Aranda", operator: "Pampa Energía", basin: "Neuquina", type: "Shale Oil", wellsActive: 34, productionOilKbbld: 6.2, productionGasMMm3d: 0.8, avgStages: 50, avgProppantTn: 2280, avgLateralM: 3250, concessionUntil: "2053" },
  { slug: "cerro-dragon", name: "Cerro Dragón", operator: "Pan American Energy", basin: "Golfo San Jorge", type: "Convencional", wellsActive: 3241, productionOilKbbld: 68.2, productionGasMMm3d: 6.1, avgStages: 0, avgProppantTn: 0, avgLateralM: 0, concessionUntil: "2047" },
];

// Producción NC nacional mensual (kbbl/d oil equivalent) — últimos 24 meses
export const productionSeries = [
  { month: "2023-11", oil: 285, gas: 82 },
  { month: "2023-12", oil: 292, gas: 84 },
  { month: "2024-01", oil: 301, gas: 86 },
  { month: "2024-02", oil: 308, gas: 88 },
  { month: "2024-03", oil: 316, gas: 90 },
  { month: "2024-04", oil: 322, gas: 91 },
  { month: "2024-05", oil: 331, gas: 93 },
  { month: "2024-06", oil: 340, gas: 95 },
  { month: "2024-07", oil: 348, gas: 97 },
  { month: "2024-08", oil: 358, gas: 99 },
  { month: "2024-09", oil: 366, gas: 101 },
  { month: "2024-10", oil: 374, gas: 103 },
  { month: "2024-11", oil: 385, gas: 105 },
  { month: "2024-12", oil: 394, gas: 107 },
  { month: "2025-01", oil: 402, gas: 109 },
  { month: "2025-02", oil: 411, gas: 110 },
  { month: "2025-03", oil: 421, gas: 112 },
  { month: "2025-04", oil: 432, gas: 114 },
  { month: "2025-05", oil: 441, gas: 116 },
  { month: "2025-06", oil: 452, gas: 118 },
  { month: "2025-07", oil: 461, gas: 120 },
  { month: "2025-08", oil: 471, gas: 121 },
  { month: "2025-09", oil: 480, gas: 123 },
  { month: "2025-10", oil: 489, gas: 124 },
];

// Curva de declinación por cohorte (barriles/día por pozo, meses desde puesta en marcha)
export const declineByCohort = Array.from({ length: 24 }, (_, i) => ({
  month: i,
  "2022": Math.round(950 * Math.exp(-0.09 * i)),
  "2023": Math.round(1120 * Math.exp(-0.085 * i)),
  "2024": Math.round(1280 * Math.exp(-0.08 * i)),
  "2025": Math.round(1420 * Math.exp(-0.075 * i)),
}));

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

export const events: EventItem[] = [
  { date: "2025-11-04", entity: "Vista Energy", entitySlug: "vista", entityType: "operator", title: "Vista firma acuerdo de midstream con Oldelval por 40 kbbl/d adicionales", category: "M&A", source: "SEC 6-K", sourceType: "SEC" },
  { date: "2025-10-28", entity: "Vista Energy", entitySlug: "vista", entityType: "operator", title: "Upgrade guidance 2025: 95→105 kbbl/d", category: "Guidance", source: "Earnings call Q3 2025", sourceType: "Corporativo" },
  { date: "2025-10-22", entity: "Loma Campana", entitySlug: "loma-campana", entityType: "area", title: "Récord de pozo: IP30 3.140 bbl/d en pad LC-458", category: "Guidance", source: "YPF investor update", sourceType: "Corporativo" },
  { date: "2025-10-14", entity: "YPF", entitySlug: "ypf", entityType: "operator", title: "Guidance Q4: 165 pozos conectados", category: "Guidance", source: "Earnings call Q3 2025", sourceType: "Corporativo" },
  { date: "2025-10-09", entity: "Regulatorio", entityType: "operator", title: "Decreto 812/2025: modificación régimen RIGI para midstream", category: "Regulatorio", source: "Boletín Oficial Nación", sourceType: "Boletín Oficial" },
  { date: "2025-10-02", entity: "Pluspetrol", entitySlug: "pluspetrol", entityType: "operator", title: "Cierre adquisición activos ExxonMobil Argentina (US$1.7B)", category: "M&A", source: "CNV hecho relevante", sourceType: "CNV" },
  { date: "2025-09-19", entity: "Pan American Energy", entitySlug: "pan-american", entityType: "operator", title: "Farm-in 40% en Coirón Amargo Sur Este", category: "Farm-in", source: "Boletín Oficial Neuquén", sourceType: "Boletín Oficial" },
  { date: "2025-09-08", entity: "Tecpetrol", entitySlug: "tecpetrol", entityType: "operator", title: "Plan Gas.Ar Ronda 3 — 15 MMm³/d comprometidos", category: "Guidance", source: "Comunicado corporativo", sourceType: "Corporativo" },
  { date: "2025-09-02", entity: "YPF", entitySlug: "ypf", entityType: "operator", title: "Cesión de 14 áreas convencionales a operadoras regionales", category: "M&A", source: "CNV hecho relevante", sourceType: "CNV" },
  { date: "2025-08-25", entity: "Pluspetrol", entitySlug: "pluspetrol", entityType: "operator", title: "Multa Ente Provincial por derrame en Centenario (AR$820M)", category: "Sanción", source: "Boletín Oficial Neuquén", sourceType: "Boletín Oficial" },
  { date: "2025-08-11", entity: "Vista Energy", entitySlug: "vista", entityType: "operator", title: "Adquisición pad-adjacent a Petronas en Bajada del Palo", category: "M&A", source: "SEC 6-K filing", sourceType: "SEC" },
  { date: "2025-07-22", entity: "Shell Argentina", entitySlug: "shell", entityType: "operator", title: "Extensión concesión Sierras Blancas hasta 2055", category: "Concesión", source: "Boletín Oficial Neuquén", sourceType: "Boletín Oficial" },
  { date: "2025-07-18", entity: "YPF", entitySlug: "ypf", entityType: "operator", title: "Prórroga concesión Loma Campana +10 años", category: "Concesión", source: "Boletín Oficial Neuquén", sourceType: "Boletín Oficial" },
];

export type Contradiction = {
  operator: string;
  operatorSlug: string;
  period: string;
  metric: string;
  announced: string;
  actual: string;
  delta: number; // % (negative = under-delivered)
  narrative: string;
};

export const contradictions: Contradiction[] = [
  { operator: "YPF", operatorSlug: "ypf", period: "9M 2025", metric: "Pozos conectados", announced: "420", actual: "368", delta: -12, narrative: "El plan de negocios presentado en febrero comprometía 420 pozos al 30/09. El Capítulo IV muestra 368 pozos con primera producción — 12% por debajo. La brecha se explica principalmente por Bandurria Sur (24 pozos diferidos)." },
  { operator: "Vista Energy", operatorSlug: "vista", period: "9M 2025", metric: "Producción oil (kbbl/d)", announced: "80–85", actual: "84.1", delta: 1, narrative: "En rango alto del guidance. Bajada del Palo Oeste sobre-performó respecto a la curva tipo comunicada en el Investor Day 2024." },
  { operator: "Pluspetrol", operatorSlug: "pluspetrol", period: "H1 2025", metric: "Capex Vaca Muerta (US$M)", announced: "780", actual: "612", delta: -22, narrative: "Ejecución 22% por debajo del guidance. La adquisición de activos ExxonMobil (cerrada octubre) parece haber reprogramado el capex orgánico." },
  { operator: "Tecpetrol", operatorSlug: "tecpetrol", period: "9M 2025", metric: "Producción gas (MMm³/d)", announced: "27.5", actual: "28.4", delta: 3, narrative: "Cumplimiento pleno. Fortín de Piedra sostiene meseta contra expectativa de declinación natural." },
  { operator: "Pan American Energy", operatorSlug: "pan-american", period: "9M 2025", metric: "Pozos conectados NC", announced: "58", actual: "44", delta: -24, narrative: "Retraso significativo en Coirón Amargo Sur Este. El farm-in cerrado en septiembre podría acelerar la curva 2026." },
];

export const glossary = [
  { term: "Capítulo IV", cat: "Regulatorio", def: "Régimen de información obligatoria de la Secretaría de Energía. Publica producción de petróleo y gas por pozo, mensual, con \"1 mes de rezago.\"" },
  { term: "Adjunto IV", cat: "Regulatorio", def: "Anexo del Capítulo IV con datos de completación por pozo: número de etapas, arena bombeada, longitud lateral. Base para todo benchmarking técnico." },
  { term: "RIGI", cat: "Regulatorio", def: "Régimen de Incentivo para Grandes Inversiones (Ley 27.742, 2024). Estabilidad fiscal por 30 años para proyectos >US$200M." },
  { term: "Plan Gas.Ar", cat: "Regulatorio", def: "Programa de estímulo al gas natural (2021→). Fija precios por volúmenes comprometidos por operadora." },
  { term: "CENCH", cat: "Regulatorio", def: "Comisión Especial de Negociación Colectiva de Hidrocarburos. Rige convenios laborales del sector." },
  { term: "DUC", cat: "Técnico", def: "Drilled but Uncompleted. Pozo perforado sin fracturar, disponible como buffer de producción." },
  { term: "Curva tipo", cat: "Técnico", def: "Perfil de producción esperado de un pozo estándar en un área, usado como benchmark de performance." },
  { term: "IP30 / IP90", cat: "Técnico", def: "Producción promedio del pozo en sus primeros 30 / 90 días. Métrica de calidad de completación." },
  { term: "Etapas de fractura", cat: "Técnico", def: "Número de secciones fracturadas hidráulicamente a lo largo del pozo horizontal. Más etapas = más contacto con la roca." },
  { term: "Farm-in / Farm-out", cat: "Comercial", def: "Transferencia parcial de participación en un área a cambio de compromiso de inversión (in) o cash (out)." },
];

export const newsletterIssues = [
  { n: 14, date: "Nov 2025", title: "Vaca Muerta cierra octubre en 489 kbbl/d — YPF vs. Vista en 3 gráficos", subs: "1.842 lectores" },
  { n: 13, date: "Oct 2025", title: "El mapa de M&A del Q3: Pluspetrol, Petronas y las tres cesiones de YPF", subs: "1.714 lectores" },
  { n: 12, date: "Sep 2025", title: "Cohorte 2025: por qué los pozos nuevos rinden 12% más que los de 2024", subs: "1.548 lectores" },
  { n: 11, date: "Ago 2025", title: "Ranking de intensidad de fractura — quién bombea más arena por metro lateral", subs: "1.402 lectores" },
  { n: 10, date: "Jul 2025", title: "Guidance vs. ejecución: 5 operadoras bajo la lupa", subs: "1.238 lectores" },
];
