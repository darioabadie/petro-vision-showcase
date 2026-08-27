import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, FileText, FileJson } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatesWrapper, StatesEmpty } from "@/components/states";
import { ChartCard } from "@/components/chart-card";
import { formatCutoffDate } from "@/lib/format";
import type { DownloadArtifact } from "@/lib/contract";

export const Route = createFileRoute("/descargas")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Descargas" },
      {
        name: "description",
        content:
          "Archivos publicados del observatorio: producción agregada, desglose por pozo, completación y reporte de calidad.",
      },
    ],
  }),
  component: DownloadsPage,
});

function DownloadsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded data={data} />} />
    </div>
  );
}

function Loaded({ data }: { data: import("@/lib/contract").ObservatoryData }) {
  const downloads = data.downloads;
  return (
    <>
      <PageHeader
        title="Descargas"
        description={`Archivos del release ${data.release.release_id} (corte ${formatCutoffDate(data.release.data_cutoff)}). Los checksums se validan contra los publicados en cada release.`}
        meta={
          <>
            <a
              href={data.site.repository_url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Repositorio y pipeline
            </a>
          </>
        }
      />

      {downloads.length === 0 ? (
        <StatesEmpty>No hay archivos de descarga en este release.</StatesEmpty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {downloads.map((artifact) => (
            <DownloadeCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      )}
    </>
  );
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} kB`;
  return `${bytes} B`;
}

function FormatIcon({ format }: { format: string }) {
  const Icon =
    format.toLowerCase() === "csv"
      ? FileSpreadsheet
      : format.toLowerCase() === "json"
        ? FileJson
        : FileText;
  return <Icon className="h-4 w-4 text-muted-foreground" />;
}

function DownloadeCard({ artifact }: { artifact: DownloadArtifact }) {
  return (
    <ChartCard
      title={artifact.title}
      subtitle={artifact.description}
      meta={
        <span className="flex items-center gap-2">
          Actualizado {formatCutoffDate(artifact.updated_at)} · {formatBytes(artifact.size_bytes)}
        </span>
      }
    >
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <FormatIcon format={artifact.format} />
          {artifact.format}
        </span>
        <a
          href={artifact.url}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar
        </a>
      </div>
    </ChartCard>
  );
}
