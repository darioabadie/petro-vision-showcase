// Formateo de presentación en es-AR. Lib pura (sin estado).

const numberFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const compactFmt = new Intl.NumberFormat("es-AR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const pctFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const monthFmt = new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric" });
const monthLongFmt = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });

export function formatNumber(value: number): string {
  return numberFmt.format(value);
}

export function formatCompact(value: number): string {
  return compactFmt.format(value);
}

export function formatPct(value: number, signed = false): string {
  const p = pctFmt.format(value);
  if (signed && value > 0) return `+${p}%`;
  return `${p}%`;
}

export function formatSignedNumber(value: number): string {
  return value > 0 ? `+${numberFmt.format(value)}` : numberFmt.format(value);
}

/** "jul 2026" (mes corto + año) a partir de un período ISO "YYYY-MM-01". */
export function formatMonth(isoPeriod: string): string {
  const d = parseIso(isoPeriod);
  return d ? monthFmt.format(d) : isoPeriod;
}

/** "julio de 2026" */
export function formatMonthLong(isoPeriod: string): string {
  const d = parseIso(isoPeriod);
  return d ? monthLongFmt.format(d) : isoPeriod;
}

/** "12 jul 2026" para fechas de corte/generación. */
export function formatCutoffDate(isoDate: string): string {
  const d = parseIso(isoDate);
  return d ? dateFmt.format(d) : isoDate;
}

/** Devuelve la parte "YYYY-MM" de un período ISO (para `desde`/`hasta`). */
export function periodToMonthInput(isoPeriod: string): string {
  return isoPeriod.slice(0, 7);
}

function parseIso(value: string): Date | null {
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
