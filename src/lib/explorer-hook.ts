import { useCallback, useMemo } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import type { ExplorerDimension, ExplorerFilters } from "./explorer";
import {
  parseDimension,
  parseExplorerFilters,
  filtersToSearchParams,
  type QueryStateDeps,
} from "./query-state";

function searchRecordToParams(search: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) params.append(key, String(item));
      }
    } else {
      params.append(key, String(value));
    }
  }
  return params;
}

function paramsToSearchObject(params: URLSearchParams): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length === 1 ? values[0] : values;
  }
  return result;
}

/**
 * Conecta los filtros del explorador con los query params de la URL,
 * de forma legible y compartible. Lee estado reactivo y navega al cambiar.
 * Requiere que la ruta use defina validateSearch que pase crudo.
 */
export function useExplorerQueryState(deps: QueryStateDeps) {
  const router = useRouter();
  const search = useRouterState({
    select: (s) => s.location.search as unknown as Record<string, unknown>,
  });

  const params = useMemo(() => searchRecordToParams(search), [search]);

  const filters = useMemo(() => parseExplorerFilters(params, deps), [params, deps]);

  const dimension = useMemo(() => parseDimension(params), [params]);

  const setFilters = useCallback(
    (next: ExplorerFilters) => {
      const nextParams = filtersToSearchParams(next);
      router.navigate({ search: paramsToSearchObject(nextParams) as unknown as never });
    },
    [router],
  );

  const setDimension = useCallback(
    (next: ExplorerDimension) => {
      const nextParams = searchRecordToParams(search);
      nextParams.set("comparar", next);
      router.navigate({ search: paramsToSearchObject(nextParams) as unknown as never });
    },
    [router, search],
  );

  return { filters, dimension, setFilters, setDimension };
}
