import { describe, expect, it } from "vitest";
import {
  filtersToSearchParams,
  parseExplorerFilters,
  parseDimension,
  parseMetric,
  type QueryStateDeps,
} from "./query-state";

const deps: QueryStateDeps = {
  products: [{ id: "oil" }, { id: "gas" }, { id: "water" }],
  periods: ["2026-01-01", "2026-02-01", "2026-03-01"],
  operators: [{ slug: "ypf" }, { slug: "vista" }, { slug: "tecpetrol" }],
  areas: ["Loma Campana", "Fortín de Piedra"],
  basins: ["NEUQUINA"],
  provinces: ["Neuquén"],
  formations: ["VACA MUERTA"],
  resourceTypes: ["NO CONVENCIONAL"],
  resourceSubtypes: ["SHALE"],
};

describe("query-state", () => {
  it("parsea filtros desde params y valida contra opciones", () => {
    const params = new URLSearchParams(
      "producto=gas&desde=2026-01-01&hasta=2026-03-01&operador=ypf&operador=vista&area=No-Existe",
    );
    const filters = parseExplorerFilters(params, deps);
    expect(filters.product).toBe("gas");
    expect(filters.startPeriod).toBe("2026-01-01");
    expect(filters.operators).toEqual(["ypf", "vista"]);
    // valores fuera de las opciones se descartan
    expect(filters.areas).toBeUndefined();
  });

  it("usa defaults seguros ante params inválidos", () => {
    const filters = parseExplorerFilters(new URLSearchParams("producto=oreo"), deps);
    expect(filters.product).toBe("oil");
  });

  it("serializa filtros a params legibles y repetibles", () => {
    const params = filtersToSearchParams({
      product: "oil",
      startPeriod: "2026-01-01",
      operators: ["ypf", "vista"],
    });
    expect(params.get("producto")).toBe("oil");
    expect(params.getAll("operador")).toEqual(["ypf", "vista"]);
  });

  it("parsea dimensión y métrica con valores por defecto", () => {
    expect(parseDimension(new URLSearchParams("comparar=area"))).toBe("area");
    expect(parseDimension(new URLSearchParams())).toBe("operator");
    expect(parseMetric(new URLSearchParams("metrica=gas_thousand_m3"))).toBe("gas_thousand_m3");
    expect(parseMetric(new URLSearchParams())).toBe("oil_m3");
  });
});
