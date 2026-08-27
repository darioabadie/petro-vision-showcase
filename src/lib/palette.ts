export const PALETTE = {
  oil: "oklch(0.82 0.22 145)",
  gas: "oklch(0.7 0.15 180)",
  water: "oklch(0.6 0.12 240)",
  conventional: "oklch(0.75 0.14 90)",
  nonconventional: "oklch(0.65 0.2 25)",
  neutral: "oklch(0.6 0.01 240)",
} as const;

/** Serie de colores para gráficos con múltiples series comparadas. */
export const SERIES_COLORS: string[] = [
  PALETTE.oil,
  PALETTE.gas,
  PALETTE.water,
  PALETTE.nonconventional,
  PALETTE.conventional,
];
