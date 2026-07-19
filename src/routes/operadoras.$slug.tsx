import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell, PageHeader, Stat } from "@/components/app-shell";
import { operators, events, contradictions } from "@/lib/mock-data";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Building2, MapPin, User } from "lucide-react";

export const Route = createFileRoute("/operadoras/$slug")({
  loader: ({ params }) => {
    const op = operators.find((o) => o.slug === params.slug);
    if (!op) throw notFound();
    return { op };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.op.name} · PetroData` : "Operadora · PetroData" },
      {
        name: "description",
        content: loaderData?.op.bio ?? "Ficha de operadora",
      },
    ],
  }),
  component: OperatorDetail,
});

function OperatorDetail() {
  const { op } = Route.useLoaderData();

  // Serie real por operadora (últimos 36 meses del histórico oficial)
  const opSeries = (op.serie ?? []).slice(-36).map((p: { month: string; oil: number; gas: number }) => ({
    month: p.month,
    oil: p.oil,
    gas: p.gas,
  }));

  const opEvents = events.filter((e) => e.entitySlug === op.slug);
  const opContradictions = contradictions.filter((c) => c.operatorSlug === op.slug);


  return (
    <AppShell>
      <PageHeader
        eyebrow={
          <Link to="/operadoras" className="hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Operadoras
          </Link> as any
        }
        title={op.name}
        description={op.bio}
        right={
          <div className="flex gap-2">
            {op.ticker && (
              <span className="h-9 px-3 rounded-md border border-border text-xs font-mono grid place-items-center text-muted-foreground">
                {op.ticker}
              </span>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {op.alias && op.alias.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="uppercase tracking-wider text-[10px]">Alias resueltos: </span>
            {op.alias.join(" · ")}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Producción oil"
            value={op.productionOilKbbld.toFixed(1)}
            unit="kbbl/d"
            delta={`${op.oilMomPct >= 0 ? "+" : ""}${op.oilMomPct}% MoM`}
          />
          <Stat label="Producción gas" value={op.productionGasMMm3d.toFixed(1)} unit="MMm³/d" />
          <Stat label="Pozos activos" value={op.wellsActive.toString()} hint={`${op.ncShare}% no convencional`} />
          <Stat label="Áreas operadas" value={op.areas.length.toString()} hint="Ver detalle abajo" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="panel p-5 lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                  Producción histórica
                </div>
                <h2 className="text-lg font-display font-semibold mt-1">
                  Oil y gas operado por {op.name}
                </h2>
              </div>
              <div className="flex gap-4 text-xs">
                <LegendDot color="var(--color-primary)" label="Oil (kbbl/d)" />
                <LegendDot color="var(--color-chart-2)" label="Gas (MMm³/d)" />
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={opSeries} margin={{ left: -10, right: 12, top: 8 }}>
                  <defs>
                    <linearGradient id="opoil" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="opgas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "var(--color-border)" }} interval={2} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "var(--color-border)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="oil" name="Oil (kbbl/d)" stroke="var(--color-primary)" strokeWidth={2} fill="url(#opoil)" />
                  <Area type="monotone" dataKey="gas" name="Gas (MMm³/d)" stroke="var(--color-chart-2)" strokeWidth={1.5} fill="url(#opgas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-5 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">Ficha</div>
              <h2 className="text-lg font-display font-semibold mt-1">Datos corporativos</h2>
            </div>
            <dl className="space-y-2.5 text-sm">
              <Row label="Tipo"><span className="text-foreground">{op.type}</span></Row>
              <Row label="País"><span className="text-foreground">{op.country}</span></Row>
              <Row label="Sede"><span className="text-foreground inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{op.hq}</span></Row>
              <Row label="CEO"><span className="text-foreground inline-flex items-center gap-1"><User className="h-3 w-3" />{op.ceo}</span></Row>
              <Row label="Fundada"><span className="num">{op.since}</span></Row>
              {op.ticker && <Row label="Ticker"><span className="num">{op.ticker}</span></Row>}
            </dl>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">Portafolio</div>
              <h2 className="text-lg font-display font-semibold mt-1">Áreas operadas</h2>
            </div>
            <ul className="space-y-2">
              {op.areas.map((a: string, i: number) => {
                const slug = op.areaSlugs[i];
                return (
                  <li key={a}>
                    <Link
                      to="/areas/$slug"
                      params={{ slug }}
                      className="flex items-center justify-between border border-border rounded-md px-3 py-2 hover:border-primary/50 transition-colors"
                    >
                      <span className="text-sm inline-flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {a}
                      </span>
                      <span className="text-xs text-muted-foreground">Ver ficha →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">Timeline</div>
              <h2 className="text-lg font-display font-semibold mt-1">Eventos recientes</h2>
            </div>
            {opEvents.length === 0 && (
              <div className="text-sm text-muted-foreground">Sin eventos registrados.</div>
            )}
            <ul className="relative space-y-4 border-l border-border ml-2">
              {opEvents.map((e) => (
                <li key={e.date + e.title} className="pl-5 relative">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                  <div className="text-xs num text-muted-foreground">{e.date}</div>
                  <div className="text-sm mt-0.5">{e.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {e.category} · Fuente: {e.source}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {opContradictions.length > 0 && (
          <div className="panel p-5">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-primary font-medium">
                Guidance vs. ejecutado
              </div>
              <h2 className="text-lg font-display font-semibold mt-1">Contradicciones detectadas</h2>
            </div>
            <div className="space-y-3">
              {opContradictions.map((c) => (
                <div key={c.metric} className="border border-border rounded-md p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{c.metric}</div>
                      <div className="text-[11px] text-muted-foreground">{c.period}</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div><span className="text-muted-foreground">Anunciado: </span><span className="num">{c.announced}</span></div>
                      <div><span className="text-muted-foreground">Real: </span><span className="num">{c.actual}</span></div>
                      <span className={`num text-sm font-semibold ${c.delta < 0 ? "text-destructive" : "text-primary"}`}>
                        {c.delta > 0 ? "+" : ""}{c.delta}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">{c.narrative}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
