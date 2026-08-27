import type { ReactNode } from "react";
import { AlertTriangle, Database, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ObservatoryData } from "@/lib/contract";
import { useObservatoryData } from "@/lib/observatory-data";

export interface LoadingProps {
  label?: string;
  rows?: number;
}

export function StatesSkeleton({ label = "Cargando datos…", rows = 5 }: LoadingProps) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        {label}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export interface ErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function StatesError({
  title = "No se pudieron cargar los datos",
  message = "Revisá tu conexión e intentá de nuevo.",
  onRetry,
}: ErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div className="font-semibold">{title}</div>
      <div className="max-w-md text-sm text-muted-foreground">{message}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      )}
    </div>
  );
}

export function StatesEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
      <Database className="h-6 w-6 opacity-60" />
      {children}
    </div>
  );
}

export function StatesSchemaIncompatible() {
  const { error, reload } = useObservatoryData();
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div className="font-semibold">Version de datos incompatible</div>
      <div className="max-w-md text-sm text-muted-foreground">
        El servidor publicó un formato de datos más nuevo que esta versión de la aplicación.
        Actualizá la página o indicá a quien mantiene al proyecto que regenere el release.
        {error?.message && (
          <code className="mt-2 block rounded bg-destructive/20 px-2 py-1 text-xs">
            {error.message}
          </code>
        )}
      </div>
      {reload && (
        <button
          type="button"
          onClick={reload}
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      )}
    </div>
  );
}

/**
 * Gate que une status del provider con los distintos estados visuales.
 * Envuelve el contenido listo (render prop con los datos).
 */
export function StatesWrapper({ ready }: { ready: (data: ObservatoryData) => ReactNode }) {
  const { data, status, error, reload } = useObservatoryData();
  if (status === "schema-incompatible") return <StatesSchemaIncompatible />;
  if (status === "error")
    return (
      <StatesError
        title="No se pudieron cargar los datos"
        message={error?.message}
        onRetry={reload}
      />
    );
  if (status === "loading" || !data) return <StatesSkeleton />;
  return <>{ready(data)}</>;
}
