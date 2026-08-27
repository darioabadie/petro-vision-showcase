import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ObservatoryData, ReleasePointer } from "./contract";
import { DataClientError, SchemaIncompatibleError, loadObservatoryData } from "./data-client";

export type ObservatoryStatus = "loading" | "ready" | "error" | "schema-incompatible";

interface ObservatoryContextValue {
  pointer: ReleasePointer | null;
  data: ObservatoryData | null;
  status: ObservatoryStatus;
  error: Error | null;
  reload: () => void;
}

const ObservatoryContext = createContext<ObservatoryContextValue | null>(null);

export function ObservatoryDataProvider({ children }: { children: ReactNode }) {
  const [pointer, setPointer] = useState<ReleasePointer | null>(null);
  const [data, setData] = useState<ObservatoryData | null>(null);
  const [status, setStatus] = useState<ObservatoryStatus>("loading");
  const [error, setError] = useState<Error | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);

  const run = useCallback(() => {
    setStatus("loading");
    setError(null);
    const promise = loadObservatoryData()
      .then(({ pointer: p, data: d }) => {
        setPointer(p);
        setData(d);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setPointer(null);
        setData(null);
        if (err instanceof SchemaIncompatibleError) {
          setStatus("schema-incompatible");
          setError(err);
        } else if (err instanceof DataClientError) {
          setStatus("error");
          setError(err);
        } else {
          setStatus("error");
          setError(
            err instanceof Error
              ? err
              : new DataClientError("Error desconocido al cargar los datos."),
          );
        }
      });
    inflightRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  useEffect(() => {
    if (
      status === "ready" &&
      data?.release.is_mock &&
      typeof document !== "undefined" &&
      document.title.length > 0 &&
      !document.title.startsWith("Demostración")
    ) {
      document.title = `Demostración · ${document.title}`;
    }
  }, [status, data]);

  const reload = useCallback(() => {
    // Si ya hay una carga en vuelo, no duplicar.
    if (inflightRef.current) return;
    void run();
  }, [run]);

  return (
    <ObservatoryContext.Provider value={{ pointer, data, status, error, reload }}>
      {children}
    </ObservatoryContext.Provider>
  );
}

export function useObservatoryData(): ObservatoryContextValue {
  const ctx = useContext(ObservatoryContext);
  if (!ctx) {
    throw new Error("useObservatoryData debe usarse dentro de <ObservatoryDataProvider>.");
  }
  return ctx;
}

// Utilidades de conveniencia.
export function useObservatoryDataOrThrow(): ObservatoryData {
  const { data } = useObservatoryData();
  if (!data) {
    throw new Error("ObservatoryData no disponible: el provider aún no cargó los datos.");
  }
  return data;
}
