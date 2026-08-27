import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, Database } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatesWrapper, StatesEmpty } from "@/components/states";
import { ChartCard } from "@/components/chart-card";
import { formatCutoffDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/periodos/$releaseId")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Release" },
      {
        name: "description",
        content:
          "Detalle de un release publicado: corte, estado y fecha de publicación del observatorio.",
      },
    ],
  }),
  component: PeriodDetailPage,
});

function PeriodDetailPage() {
  const { releaseId } = Route.useParams();
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded releaseId={releaseId} data={data} />} />
    </div>
  );
}

function Loaded({
  releaseId,
  data,
}: {
  releaseId: string;
  data: import("@/lib/contract").ObservatoryData;
}) {
  const release = data.release_history.find((r) => r.release_id === releaseId);

  return (
    <>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver
      </Link>

      <PageHeader
        title={`Release ${releaseId}`}
        description="Versión puntual de los datos publicados por el observatorio."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Corte {data.release.data_cutoff}
            </span>
            <span className="text-muted-foreground">· actual: {data.release.release_id}</span>
          </>
        }
      />

      {!release ? (
        <StatesEmpty>
          <Database className="h-5 w-5" />
          No existe el release <code className="rounded bg-muted px-1">{releaseId}</code> en el
          historial publicado.
          <a href="/" className="mt-1 text-primary hover:underline">
            Volver al resumen
          </a>
        </StatesEmpty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Metadatos del release">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Release</dt>
              <dd className="font-mono">{release.release_id}</dd>
              <dt className="text-muted-foreground">Corte de datos</dt>
              <dd>{formatCutoffDate(release.data_cutoff)}</dd>
              <dt className="text-muted-foreground">Publicado</dt>
              <dd>{formatCutoffDate(release.published_at)}</dd>
              <dt className="text-muted-foreground">Estado</dt>
              <dd>
                <StatusPill status={release.status} />
              </dd>
              <dt className="text-muted-foreground">Actual</dt>
              <dd>{release.is_current ? "Sí — es el release vigente" : "No"}</dd>
            </dl>
          </ChartCard>

          <div
            className={cn(
              "rounded-lg border border-border/70 bg-card/50 p-4 text-xs text-muted-foreground",
            )}
          >
            <h3 className="mb-1 font-medium text-foreground">Cómo navegar los releases</h3>
            <p>
              El observatorio publica releases con corte mensual. Cada release es reproducible: un
              commit de pipeline, una versión de esquema y un reporte de calidad propio. En los
              releases históricos los períodos pueden estar marcados como incompletos o revisados.
            </p>
            <p className="mt-2">
              Descargá los archivos desde{" "}
              <Link to="/descargas" className="underline underline-offset-2 hover:text-foreground">
                /descargas
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const ok = status === "complete";
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
        ok ? "bg-primary/15 text-emerald-400" : "bg-warning/15 text-warning",
      )}
    >
      {status}
    </span>
  );
}
