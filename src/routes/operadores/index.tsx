import { useMemo, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatesWrapper } from "@/components/states";
import { ChartCard } from "@/components/chart-card";
import { formatCutoffDate, formatNumber, formatPct } from "@/lib/format";
import type { OperatorRanking } from "@/lib/contract";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/operadores/")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Operadores" },
      {
        name: "description",
        content:
          "Ranking de operadores en Vaca Muerta por producción de petróleo y gas, con participación de mercado y evolución intermensual.",
      },
    ],
  }),
  component: OperatorsPage,
});

function OperatorsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded data={data} />} />
    </div>
  );
}

function Loaded({ data }: { data: import("@/lib/contract").ObservatoryData }) {
  const rankings = data.operators.rankings;
  const profiles = data.operators.profiles;
  const bySlug = useMemo(() => new Map(profiles.map((p) => [p.slug, p])), [profiles]);

  return (
    <>
      <PageHeader
        title="Operadores"
        description="Ranking mensual de producción y fichas por operador. Trabajá la serie más a fondo en /produccion."
        meta={
          <>
            <span>Al corte {formatCutoffDate(data.release.data_cutoff)}</span>
            <span className="text-muted-foreground">· {data.release.release_id}</span>
          </>
        }
      />

      <ChartCard
        title="Ranking de producción"
        subtitle="Petróleo y gas del último mes completo, participación y variación."
      >
        <RankingTable rankings={rankings} />
      </ChartCard>

      {profiles.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-sm font-semibold tracking-tight">Fichas por operador</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => {
              const rank = rankings.find((r) => r.slug === profile.slug);
              return (
                <Link
                  key={profile.slug}
                  to="/operadores/$slug"
                  params={{ slug: profile.slug }}
                  className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      <span className="font-medium">{profile.name}</span>
                    </div>
                    {rank && <span className="text-xs text-muted-foreground">#{rank.rank}</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <Cell>
                      Petróleo
                      <b className="block font-display text-sm text-foreground tabular-nums">
                        {rank ? formatNumber(rank.oil_m3) : "—"} m³
                      </b>
                    </Cell>
                    <Cell>
                      Gas
                      <b className="block font-display text-sm text-foreground tabular-nums">
                        {rank ? formatNumber(rank.gas_thousand_m3) : "—"} miles m³
                      </b>
                    </Cell>
                    <Cell>
                      Participación
                      <b className="block font-display text-sm text-foreground tabular-nums">
                        {rank ? formatPct(rank.share_oil_pct) : "—"}
                      </b>
                    </Cell>
                    <Cell>
                      Variación mensual
                      <b className="block font-display text-sm text-foreground tabular-nums">
                        {rank ? formatSigned(rank.change_mom_pct) : "—"}
                      </b>
                    </Cell>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {bySlug.size > 0 && (
        <p className="mt-6 text-xs text-muted-foreground">
          Normas de medición en{" "}
          <Link to="/metodologia" className="underline underline-offset-2 hover:text-foreground">
            /metodologia
          </Link>
          .
        </p>
      )}
    </>
  );
}

function Cell({ children }: { children: ReactNode }) {
  return <div className="rounded-md bg-muted/40 px-2.5 py-2">{children}</div>;
}

function formatSigned(pct: number): string {
  return pct > 0 ? `+${formatPct(pct)}` : formatPct(pct);
}

function RankingTable({ rankings }: { rankings: OperatorRanking[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <RankingTh>#</RankingTh>
            <RankingTh>Operador</RankingTh>
            <RankingTh className="text-right">Petróleo (m³)</RankingTh>
            <RankingTh className="text-right">Gas (miles m³)</RankingTh>
            <RankingTh className="text-right">Part. petróleo</RankingTh>
            <RankingTh className="text-right">MoM</RankingTh>
            <RankingTh className="text-right">YoY</RankingTh>
            <RankingTh className="text-right">Pozos</RankingTh>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r) => (
            <tr key={r.slug} className="border-b border-border/60 hover:bg-muted/30">
              <RankingTd className="text-muted-foreground">{r.rank}</RankingTd>
              <RankingTd>
                <Link
                  to="/operadores/$slug"
                  params={{ slug: r.slug }}
                  className="font-medium hover:text-primary"
                >
                  {r.name}
                </Link>
              </RankingTd>
              <RankingTd className="text-right tabular-nums">{formatNumber(r.oil_m3)}</RankingTd>
              <RankingTd className="text-right tabular-nums">
                {formatNumber(r.gas_thousand_m3)}
              </RankingTd>
              <RankingTd className="text-right tabular-nums">
                {formatPct(r.share_oil_pct)}
              </RankingTd>
              <RankingTd className="text-right tabular-nums">
                <ChangeCell color={r.change_mom_pct} value={formatSigned(r.change_mom_pct)} />
              </RankingTd>
              <RankingTd className="text-right tabular-nums">
                <ChangeCell color={r.change_yoy_pct} value={formatSigned(r.change_yoy_pct)} />
              </RankingTd>
              <RankingTd className="text-right tabular-nums text-muted-foreground">
                {formatNumber(r.productive_wells)}
              </RankingTd>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankingTh({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2", className)}>{children}</th>;
}

function RankingTd({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5", className)}>{children}</td>;
}

function ChangeCell({ value, color }: { value: string; color: number }) {
  return (
    <span
      className={cn(
        "tabular-nums",
        color > 0 ? "text-emerald-400" : color < 0 ? "text-red-400" : "text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}
