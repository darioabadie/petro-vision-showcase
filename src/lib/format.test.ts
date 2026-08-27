import { describe, expect, it } from "vitest";
import { formatMonth, formatMonthLong, formatNumber, formatPct, formatCutoffDate } from "./format";

describe("format", () => {
  it("formatea meses es-AR cortos desde períodos ISO", () => {
    expect(formatMonth("2026-07-01")).toBe("jul 2026");
    expect(formatMonth("2025-12-01")).toBe("dic 2025");
  });

  it("formatea meses largos", () => {
    expect(formatMonthLong("2026-07-01")).toBe("julio de 2026");
  });

  it("formatea fechas de corte", () => {
    expect(formatCutoffDate("2026-07-31")).toMatch(/de jul de 2026/);
  });

  it("formatea números con separador de miles es-AR", () => {
    expect(formatNumber(6298000)).toBe("6.298.000");
    expect(formatNumber(1234)).toBe("1.234");
  });

  it("formatea porcentajes y signo", () => {
    expect(formatPct(2.8)).toBe("2,8%");
    expect(formatPct(2.8, true)).toBe("+2,8%");
    expect(formatPct(-1.2)).toBe("-1,2%");
  });
});
