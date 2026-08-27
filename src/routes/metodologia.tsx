import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/page-header";
import { StatesWrapper, StatesEmpty } from "@/components/states";

export const Route = createFileRoute("/metodologia")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Metodología" },
      {
        name: "description",
        content:
          "Definiciones, fuentes y advertencias metodológicas del observatorio de producción de Vaca Muerta.",
      },
    ],
  }),
  component: MethodologyPage,
});

function MethodologyPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded data={data} />} />
    </div>
  );
}

function Loaded({ data }: { data: import("@/lib/contract").ObservatoryData }) {
  const m = data.methodology;
  return (
    <>
      <PageHeader
        title="Metodología"
        description="Cómo se definen y calculan las métricas del observatorio, de dónde vienen los datos y qué limitaciones tienen."
        meta={
          <>
            <span>Release {data.release.release_id}</span>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4 md:p-5">
          <h2 className="mb-3 font-display text-sm font-semibold tracking-tight">Definiciones</h2>
          {m.definitions.length === 0 ? (
            <StatesEmpty>No hay definiciones publicadas en este release.</StatesEmpty>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {m.definitions.map((def) => (
                <AccordionItem key={def.id} value={def.id}>
                  <AccordionTrigger className="text-sm">{def.term}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {def.definition}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 md:p-5">
            <h2 className="mb-3 font-display text-sm font-semibold tracking-tight">Fuentes</h2>
            {m.sources.length === 0 ? (
              <StatesEmpty>No hay fuentes declaradas.</StatesEmpty>
            ) : (
              <ul className="space-y-2">
                {m.sources.map((s) => (
                  <li key={s.source_id} className="rounded-md border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.publisher}</div>
                      </div>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                          fuente
                        </a>
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      Licencia: {s.license}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 md:p-5">
            <h2 className="mb-3 font-display text-sm font-semibold tracking-tight">Advertencias</h2>
            {m.caveats.length === 0 ? (
              <StatesEmpty>Sin advertencias.</StatesEmpty>
            ) : (
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {m.caveats.map((caveat, i) => (
                  <li key={i} className="mb-1.5 last:mb-0">
                    {caveat}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Historial de releases:{" "}
        <Link
          to="/periodos/$releaseId"
          params={{ releaseId: data.release.release_id }}
          className="underline underline-offset-2 hover:text-foreground"
        >
          ver release actual
        </Link>
        . Descargas de los archivos en{" "}
        <Link to="/descargas" className="underline underline-offset-2 hover:text-foreground">
          /descargas
        </Link>
        .
      </p>
    </>
  );
}
