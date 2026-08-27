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

/**
 * Versión hex de la paleta para consumidores que no interpretan oklch(),
 * como MapLibre/WebGL (los paint properties del style spec solo aceptan
 * css-color soportados por el parseador interno).
 */
export const PALETTE_HEX = {
  oil: "#4ee75f",
  gas: "#00bca2",
  water: "#2b88c0",
  conventional: "#d0a92d",
  nonconventional: "#f14d4c",
  neutral: "#7b8186",
  stroke: "#12171a",
} as const;

export const SERIES_COLORS_HEX: string[] = [
  PALETTE_HEX.oil,
  PALETTE_HEX.gas,
  PALETTE_HEX.water,
  PALETTE_HEX.nonconventional,
  PALETTE_HEX.conventional,
];
