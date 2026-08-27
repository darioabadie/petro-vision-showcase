import { describe, expect, it } from "vitest";
import {
  DataClientError,
  SchemaIncompatibleError,
  isCompatibleSchemaVersion,
  parseObservatoryPayload,
  parseReleasePointer,
} from "./data-client";

const validPointer = {
  release_id: "mock-2026-07",
  data_cutoff: "2026-07-31",
  generated_at: "2026-08-27T12:00:00Z",
  schema_version: "1.0",
  status: "mock",
  base_path: "/data/releases/mock-2026-07/",
  app_data_file: "app-data.json",
};

const validPayload = {
  schema_version: "1.0",
  release: { release_id: "mock-2026-07", is_mock: true },
  site: {},
  filter_options: {},
  home: {},
  explorer: {},
  operators: {},
  cohorts: {},
  completions: {},
  map: {},
  quality: {},
  downloads: [],
  methodology: {},
  release_history: [],
};

describe("data-client", () => {
  it("reconoce la versión mayor soportada", () => {
    expect(isCompatibleSchemaVersion("1.0")).toBe(true);
    expect(isCompatibleSchemaVersion("1.4")).toBe(true);
    expect(isCompatibleSchemaVersion("2.0")).toBe(false);
    expect(isCompatibleSchemaVersion(null)).toBe(false);
  });

  it("parsea el puntero de release y valida el schema", () => {
    const pointer = parseReleasePointer(validPointer);
    expect(pointer.release_id).toBe("mock-2026-07");
  });

  it("lanza SchemaIncompatibleError para schema mayor distinto", () => {
    expect(() => parseReleasePointer({ ...validPointer, schema_version: "2.0" })).toThrow(
      SchemaIncompatibleError,
    );
  });

  it("lanza DataClientError ante punteros inválidos", () => {
    expect(() => parseReleasePointer({})).toThrow(DataClientError);
    expect(() => parseReleasePointer(null)).toThrow(DataClientError);
  });

  it("valida las claves de primer nivel del payload", () => {
    const missingHome = {
      ...validPayload,
    } as unknown as Record<string, unknown>;
    delete missingHome.home;
    expect(() => parseObservatoryPayload(missingHome)).toThrow(/no contiene/);
    expect(() => parseObservatoryPayload({ ...validPayload, schema_version: "5.0" })).toThrow(
      SchemaIncompatibleError,
    );
  });

  it("acepta un payload observatorio válido", () => {
    expect(() => parseObservatoryPayload(validPayload)).not.toThrow();
  });
});
