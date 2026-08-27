import { describe, expect, it } from "vitest";
import type { ExplorerRow, ProductId } from "./contract";
import { filterExplorerRows, seriesBy, summarizeDimension, PRODUCT_METRIC } from "./explorer";

function row(partial: Partial<ExplorerRow>): ExplorerRow {
  return {
    period: "2026-07-01",
    operator_slug: "ypf",
    operator_name: "YPF",
    province: "Neuquén",
    basin: "NEUQUINA",
    area: "Loma Campana",
    field: "",
    formation: "VACA MUERTA",
    resource_type: "NO CONVENCIONAL",
    resource_subtype: "SHALE",
    oil_m3: 1000,
    gas_thousand_m3: 500,
    water_m3: 2000,
    productive_wells: 10,
    is_complete: true,
    ...partial,
  };
}

const rows: ExplorerRow[] = [
  row({ period: "2026-01-01", operator_slug: "ypf", oil_m3: 1000 }),
  row({ period: "2026-02-01", operator_slug: "ypf", oil_m3: 1100 }),
  row({ period: "2026-01-01", operator_slug: "vista", operator_name: "Vista Energy", oil_m3: 500 }),
  row({ period: "2026-02-01", operator_slug: "vista", operator_name: "Vista Energy", oil_m3: 600 }),
];

describe("PRODUCT_METRIC", () => {
  it("mapea cada producto a su métrica", () => {
    expect(PRODUCT_METRIC.oil).toBe("oil_m3");
    expect(PRODUCT_METRIC.gas).toBe("gas_thousand_m3");
    expect(PRODUCT_METRIC.water).toBe("water_m3");
  });
});

describe("filterExplorerRows", () => {
  it("respeta el rango de períodos", () => {
    const out = filterExplorerRows(rows, {
      product: "oil",
      startPeriod: "2026-02-01",
    });
    expect(out).toHaveLength(2);
    expect(out.every((r) => r.period === "2026-02-01")).toBe(true);
  });

  it("filtra por operador", () => {
    const out = filterExplorerRows(rows, { product: "oil", operators: ["vista"] });
    expect(out).toHaveLength(2);
  });
});

describe("seriesBy", () => {
  it("agrega series por dimensión y ordena por total", () => {
    const series = seriesBy(rows, { product: "oil" }, "operator", "oil_m3", 5);
    expect(series).toHaveLength(2);
    expect(series[0].key).toBe("ypf");
    expect(series[0].total).toBe(2100);
    expect(series[0].points).toEqual([
      { period: "2026-01-01", value: 1000 },
      { period: "2026-02-01", value: 1100 },
    ]);
  });

  it("limita a maxSeries", () => {
    const series = seriesBy(rows, { product: "oil" }, "operator", "oil_m3", 1);
    expect(series).toHaveLength(1);
  });
});

describe("summarizeDimension", () => {
  it("calcula total, pozos y share sobre el líder", () => {
    const items = summarizeDimension(rows, { product: "oil" }, "operator", "oil_m3");
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.key === "ypf")?.total).toBe(2100);
    expect(items.find((i) => i.key === "vista")?.shareOfTop).toBeCloseTo((1100 / 2100) * 100, 1);
  });
});
