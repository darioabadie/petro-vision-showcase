// Valida los datos publicados contra los contratos JSON Schema (Task 0.2).
// Fuente de verdad: contracts/*.schema.json. Se mantiene en sync con
// src/lib/contract.ts.
import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const ROOT = process.cwd();
const SCHEMAS_DIR = resolve(ROOT, "contracts");
const DATA_DIR = resolve(ROOT, "public/data");

function compile(ajv: Ajv, name: string) {
  const schema = JSON.parse(readFileSync(resolve(SCHEMAS_DIR, name), "utf8"));
  delete schema.$schema;
  delete schema.$id;
  return ajv.compile(schema);
}

function load(relPath: string) {
  return JSON.parse(readFileSync(resolve(DATA_DIR, relPath), "utf8"));
}

describe("contract JSON Schema", () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validatePointer = compile(ajv, "release-pointer.schema.json");
  const validateAppData = compile(ajv, "app-data.schema.json");

  it("valida latest.json contra release-pointer.schema.json", () => {
    const latest = load("latest.json");
    const ok = validatePointer(latest);
    if (!ok) throw new Error(JSON.stringify(validatePointer.errors, null, 2));
    expect(ok).toBe(true);
  });

  it("valida la release mock contra app-data.schema.json", () => {
    const mock = load("releases/mock-2026-07/app-data.json");
    const ok = validateAppData(mock);
    if (!ok) throw new Error(JSON.stringify(validateAppData.errors, null, 2));
    expect(ok).toBe(true);
  });

  it("valida todas las releases publicadas contra app-data.schema.json", () => {
    const { readdirSync } = require("node:fs");
    const releasesDir = resolve(DATA_DIR, "releases");
    for (const dir of readdirSync(releasesDir)) {
      const data = load(`releases/${dir}/app-data.json`);
      const ok = validateAppData(data);
      if (!ok) {
        throw new Error(
          `release ${dir} inválida:\n` + JSON.stringify(validateAppData.errors, null, 2),
        );
      }
      expect(ok).toBe(true);
    }
  });
});