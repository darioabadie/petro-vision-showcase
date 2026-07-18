import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { operators } from "@/lib/mock-data";
import { Building2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/operadoras/")({
  head: () => ({
    meta: [
      { title: "Operadoras · PetroData" },
      {
        name: "description",
        content:
          "Ranking y fichas de operadoras activas en Vaca Muerta y otras cuencas argentinas. Producción, pozos activos y participación NC.",
      },
    ],
  }),
  component: OperatorsList,
});

function OperatorsList() {
  const sorted = [...operators].sort((a, b) => b.productionOilKbbld - a.productionOilKbbld);
  return (
    <AppShell>
      <PageHeader
        eyebrow={`${operators.length} operadoras activas`}
        title="Operadoras"
        description="Fichas auto-generadas desde el Capítulo IV. Cada operadora agrega alias, participaciones cruzadas, timeline de eventos y contradicciones guidance vs. ejecución."
      />
      <div className="p-6">
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Operadora</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Tipo</th>
                <th className="text-right px-4 py-3 font-medium">Oil (kbbl/d)</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Gas (MMm³/d)</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Pozos</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">% NC</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((o, i) => (
                <tr key={o.slug} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 num text-muted-foreground text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      to="/operadoras/$slug"
                      params={{ slug: o.slug }}
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="h-8 w-8 rounded-md bg-muted border border-border grid place-items-center text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium group-hover:text-primary">{o.name}</div>
                        <div className="text-[11px] text-muted-foreground">{o.country}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                    {o.type}
                  </td>
                  <td className="px-4 py-3 num text-right">{o.productionOilKbbld.toFixed(1)}</td>
                  <td className="px-4 py-3 num text-right hidden sm:table-cell">
                    {o.productionGasMMm3d.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 num text-right hidden md:table-cell">{o.wellsActive}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${o.ncShare}%` }}
                        />
                      </div>
                      <span className="num text-xs text-muted-foreground w-8 text-right">
                        {o.ncShare}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
