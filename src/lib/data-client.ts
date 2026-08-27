import type { ObservatoryData, ReleasePointer } from "./contract";

export const POINTER_URL = "/data/latest.json";
export const SUPPORTED_SCHEMA_MAJOR = "1";

/**
 * Indica que el schema_version no es compatible con este frontend.
 */
export class SchemaIncompatibleError extends Error {
  readonly receivedVersion: string;

  constructor(receivedVersion: string, message?: string) {
    super(
      message ??
        `Versión de esquema incompatiblible: ${receivedVersion}. Esta versión soporta schema ${SUPPORTED_SCHEMA_MAJOR}.x.`,
    );
    this.name = "SchemaIncompatibleError";
    this.receivedVersion = receivedVersion;
  }
}

export class DataClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataClientError";
  }
}

const OBSERVATORY_TOP_LEVEL_KEYS = [
  "schema_version",
  "release",
  "site",
  "filter_options",
  "home",
  "explorer",
  "operators",
  "cohorts",
  "completions",
  "map",
  "quality",
  "downloads",
  "methodology",
  "release_history",
] as const;

/**
 * Verifica que el schema_version publicado empiece con la versión mayor
 * soportada ("1."). Devuelve true si es compatible.
 */
export function isCompatibleSchemaVersion(version: unknown): boolean {
  return typeof version === "string" && version.startsWith(`${SUPPORTED_SCHEMA_MAJOR}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parsea y valida el puntero de release (latest.json). Lanza DataClientError
 * o SchemaIncompatibleError si el payload no es válido.
 */
export function parseReleasePointer(json: unknown): ReleasePointer {
  if (!isRecord(json)) {
    throw new DataClientError("El puntero de release no es un objeto válido.");
  }
  const pointer = json as Partial<ReleasePointer>;
  for (const key of [
    "release_id",
    "data_cutoff",
    "generated_at",
    "schema_version",
    "base_path",
    "app_data_file",
  ] as const) {
    if (typeof pointer[key] !== "string") {
      throw new DataClientError(`El puntero de release no contiene "${key}".`);
    }
  }
  if (!isCompatibleSchemaVersion(pointer.schema_version)) {
    throw new SchemaIncompatibleError(String(pointer.schema_version));
  }
  return pointer as ReleasePointer;
}

/**
 * Parsea y valida la estructura de primer nivel de app-data.json.
 * No valida el contenido interno de cada sección (se hace por consumo).
 */
export function parseObservatoryPayload(json: unknown): ObservatoryData {
  if (!isRecord(json)) {
    throw new DataClientError("El payload observatorio no es un objeto válido.");
  }
  for (const key of OBSERVATORY_TOP_LEVEL_KEYS) {
    if (!(key in json)) {
      throw new DataClientError(`El payload observatorio no contiene "${key}".`);
    }
  }
  const payload = json as unknown as ObservatoryData;
  if (!isCompatibleSchemaVersion(payload.schema_version)) {
    throw new SchemaIncompatibleError(String(payload.schema_version));
  }
  return payload;
}

/**
 * Único módulo de la aplicación que ejecuta fetch() contra los datos.
 * Carga /data/latest.json y resuelve base_path + app_data_file.
 */
export async function loadObservatoryData(
  fetchImpl: typeof fetch = fetch,
): Promise<{ pointer: ReleasePointer; data: ObservatoryData }> {
  let pointerResponse: Response;
  try {
    pointerResponse = await fetchImpl(POINTER_URL);
  } catch {
    throw new DataClientError("No se pudo conectar para cargar el puntero de release.");
  }
  if (!pointerResponse.ok) {
    throw new DataClientError(`No se pudo cargar ${POINTER_URL} (HTTP ${pointerResponse.status}).`);
  }
  const pointer = parseReleasePointer(await pointerResponse.json());

  const dataUrl = `${pointer.base_path}${pointer.app_data_file}`;
  let dataResponse: Response;
  try {
    dataResponse = await fetchImpl(dataUrl);
  } catch {
    throw new DataClientError("No se pudo conectar para cargar los datos del observatorio.");
  }
  if (!dataResponse.ok) {
    throw new DataClientError(`No se pudo cargar ${dataUrl} (HTTP ${dataResponse.status}).`);
  }
  const data = parseObservatoryPayload(await dataResponse.json());

  return { pointer, data };
}
