import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Building2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatesWrapper, StatesEmpty } from "@/components/states";
import { ChartCard } from "@/components/chart-card";
import { ChartTooltip } from "@/components/chart-tooltip";
import { formatMonth, formatNumber, formatPct } from "@/lib/format";
import { PALETTE } from "@/lib/palette";

export const Route = createFileRoute("/operadores/$slug")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Operador" },
      {
        name: "description",
        content:
          "Ficha de un operador en Vaca Muerta: mix por área y recurso, pozos nuevos y referencia a sus cohortes.",
      },
    ],
  }),
  component: OperatorDetailPage,
});

function OperatorDetailPage() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded slug={slug} data={data} />} />
    </div>
  );
}

function Loaded({ slug, data }: { slug: string; data: import("@/lib/contract").ObservatoryData }) {
  const profile = data.operators.profiles.find((p) => p.slug === slug);
  const ranking = data.operators.rankings.find((r) => r.slug === slug);

  const cohortLinks = useMemo(() => profile?.cohort_ids ?? [], [profile]);

  if (!profile) {
    return (
      <StatesEmpty>
        No existe la ficha del operador <code className="rounded bg-muted px-1">{slug}</code> en
        este release.
        <Link
          to="/operadores"
          className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al ranking
        </Link>
      </StatesEmpty>
    );
  }

  const wellsByPeriod = profile.new_productive_wells.map((w) => ({
    period: w.period,
    count: w.count,
  }));

  const aliasNote = profile.alias_note;

  return (
    <>
      <Link
        to="/operadores"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver al ranking
      </Link>

      <PageHeader
        title={profile.name}
        description={`${aliasNote ?? "Perfil de producción de " + profile.name}.`}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {ranking
                ? formatPct(ranking.share_oil_pct) + " del petróleo del mes"
                : "Sin ranking en el último mes"}
            </span>
            <span className="text-muted-foreground">· {data.release.release_id}</span>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Mix por área"
          subtitle="Producción de petróleo del período por área, según los datos de corte."
        >
          {profile.area_mix.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin datos de mix por área.
            </p>
          ) : (
            <div className="space-y-2">
              {profile.area_mix.map((area) => (
                <div key={area.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{area.label}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatNumber(area.oil_m3)} m³ · {formatPct(area.share_pct)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${area.share_pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Mix por recurso"
          subtitle="Composición convencional vs no convencional de la producción."
        >
          {profile.resource_mix.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin datos de recurso.</p>
          ) : (
            <div className="space-y-2">
              {profile.resource_mix.map((r) => (
                <div key={r.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{r.label}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatPct(r.value_pct)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-chart-4"
                      style={{ width: `${r.value_pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Pozos nuevos productivos"
          subtitle="Pozos que registraron su primera producción, por mes."
        >
          {wellsByPeriod.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin pozos nuevos.</p>
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wellsByPeriod} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="oklch(0.3 0.008 240)"
                  />
                  <XAxis
                    dataKey="period"
                    tickFormatter={formatMonth}
                    tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={18}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "oklch(0.68 0.01 240)" }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    content={<ChartTooltip unit="pozos" />}
                    cursor={{ fill: "oklch(0.24 0.01 240 / 0.4)" }}
                  />
                  <Bar
                    dataKey="count"
                    name="Pozos nuevos"
                    fill={PALETTE.oil}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Cohortes del operador"
          subtitle="Las curvas por cohorte derivadas del desglose mensual."
        >
          {cohortLinks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Este operador no tiene cohortes publicadas en este release.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {cohortLinks.map((id) => (
                <li key={id}>
                  <Link
                    to="/pozos-y-cohortes"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <span className="font-mono text-xs">{id}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Las cohortes se definen por área, formación y trimestre de inicio; ver
            /pozos-y-cohortes.
          </p>
        </ChartCard>
      </div>
    </>
  );
}
