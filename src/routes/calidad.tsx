import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { StatesWrapper } from "@/components/states";
import { ChartCard } from "@/components/chart-card";
import { formatCutoffDate, formatNumber, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QualityData } from "@/lib/contract";

export const Route = createFileRoute("/calidad")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Calidad de datos" },
      {
        name: "description",
        content:
          "Reporte de calidad del release: puntaje global, controles de integridad, cobertura de cruces y reconciliación con series de control.",
      },
    ],
  }),
  component: QualityPage,
});

function QualityPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded data={data} />} />
    </div>
  );
}

function Loaded({ data }: { data: import("@/lib/contract").ObservatoryData }) {
  const q: QualityData = data.quality;
  return (
    <>
      <PageHeader
        title="Calidad de datos"
        description="Cada release se valida de forma reproducible: integridad de cruces, reconciliación con series de control y detección de revisiones de fuentes."
        meta={
          <>
            <span>Última corrida: {formatCutoffDate(q.overall.last_successful_run)}</span>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Puntaje de calidad"
          displayValue={`${q.overall.score_pct}%`}
          status={q.overall.status}
        />
        <KpiCard
          label="Controles críticos fallidos"
          displayValue={String(q.overall.critical_tests_failed)}
        />
        <KpiCard label="Advertencias" displayValue={String(q.overall.warnings)} />
        <KpiCard label="Filas procesadas" displayValue={formatNumber(q.overall.rows_processed)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Controles de integridad" subtitle="Resultado por check en este release.">
          <ChecksTable checks={q.checks} />
        </ChartCard>
        <ChartCard
          title="Fuentes utilizadas"
          subtitle="Fecha de modificación detectada y checksum corto."
        >
          <SourcesTable sources={q.sources} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Cobertura de cruces"
          subtitle="Relación y porcentaje de match entre datasets."
        >
          {q.join_coverage.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin cruces publicados.</p>
          ) : (
            <ul className="space-y-3">
              {q.join_coverage.map((join) => (
                <li key={join.relationship}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{join.relationship}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatNumber(join.matched)} / {formatNumber(join.total)} ·{" "}
                      {formatPct(join.coverage_pct)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        join.coverage_pct < 90 ? "bg-warning" : "bg-primary",
                      )}
                      style={{ width: `${Math.min(join.coverage_pct, 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard
          title="Reconciliación con control"
          subtitle="Agregado por pozo vs. serie de control, por mes y producto."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Período</th>
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2 text-right">Por pozo</th>
                  <th className="px-3 py-2 text-right">Control</th>
                  <th className="px-3 py-2 text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {q.reconciliation.map((r) => (
                  <tr
                    key={`${r.period}-${r.product}`}
                    className="border-b border-border/60 hover:bg-muted/30"
                  >
                    <td className="px-3 py-2.5 tabular-nums">{r.period}</td>
                    <td className="px-3 py-2.5">{r.product}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatNumber(r.well_aggregate)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatNumber(r.control_series)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <DiffBadge value={r.difference_pct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {q.revisions.length > 0 && (
        <div className="mt-4">
          <ChartCard
            title="Revisiones detectadas"
            subtitle="La fuente cambió para períodos históricos: los datos fueron recalculados."
          >
            <ul className="space-y-2 text-sm">
              {q.revisions.map((rev, i) => (
                <li
                  key={`${rev.source_id}-${i}`}
                  className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2 last:border-0"
                >
                  <span className="rounded bg-warning/15 px-1.5 py-0.5 font-mono text-xs text-warning">
                    revisión
                  </span>
                  <span className="font-medium">{rev.source_id}</span>
                  <span className="text-muted-foreground">
                    {rev.affected_period_start} → {rev.affected_period_end} ·{" "}
                    {formatNumber(rev.changed_rows)} filas
                  </span>
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>
      )}
    </>
  );
}

function ChecksTable({ checks }: { checks: QualityData["checks"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2">Check</th>
            <th className="px-3 py-2">Severidad</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Filas</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((check) => (
            <tr key={check.check_id} className="border-b border-border/60">
              <td className="px-3 py-2.5">
                <div className="font-medium">{check.label}</div>
                <div className="font-mono text-xs text-muted-foreground">{check.check_id}</div>
              </td>
              <td className="px-3 py-2.5 overflow-auto">
                <SeverityBadge severity={check.severity} />
              </td>
              <td className="px-3 py-2.5 overflow-auto">
                <StatusBadge status={check.status} />
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                {formatNumber(check.affected_rows)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourcesTable({ sources }: { sources: QualityData["sources"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2">Fuente</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Filas</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source.source_id} className="border-b border-border/60">
              <td className="px-3 py-2.5">
                <div className="font-medium">{source.name}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  mod. {source.source_last_modified} · obtenido {source.retrieved_at} ·{" "}
                  {source.checksum_short}
                </div>
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge status={source.status} />
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                {formatNumber(source.row_count)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "ok" || status === "pass" || status === "complete";
  const icon = ok ? (
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
  ) : status === "warn" || status === "warning" ? (
    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
  ) : (
    <XCircle className="h-3.5 w-3.5 text-red-400" />
  );
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        ok
          ? "text-emerald-400"
          : status === "warn" || status === "warning"
            ? "text-warning"
            : "text-red-400",
      )}
    >
      {icon}
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const critical = severity === "critical" || severity === "error";
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
        critical ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground",
      )}
    >
      {severity}
    </span>
  );
}

function DiffBadge({ value }: { value: number }) {
  const ok = Math.abs(value) < 0.5;
  return (
    <span className={cn("tabular-nums text-xs", ok ? "text-emerald-400" : "text-warning")}>
      {value > 0 ? "+" : ""}
      {formatPct(value)}
    </span>
  );
}
