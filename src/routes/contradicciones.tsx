import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ArrowUpRight, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/contradicciones")({
  head: () => ({
    meta: [
      { title: "Guidance tracker · PetroData" },
      {
        name: "description",
        content:
          "Cruce sistemático guidance anunciado vs. ejecutado — en el roadmap de PetroData.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="En el roadmap · sin fecha"
        title="Guidance tracker"
        description="El cruce de guidance anunciado vs. producción real del Capítulo IV requiere ingesta de earnings calls, filings CNV y prensa especializada. Esa capa editorial no está en el scope del lanzamiento actual."
      />
      <div className="p-6">
        <div className="panel p-8 flex flex-col items-start gap-4 max-w-lg">
          <div className="h-10 w-10 rounded-md bg-muted border border-border grid place-items-center">
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-display font-semibold text-lg">Disponible en una fase posterior</div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              El lanzamiento actual es 100% numérico: solo datos estructurados de la Secretaría
              de Energía (Capítulo IV y Adjunto IV). El guidance tracker depende de fuentes
              textuales que se incorporan en la Etapa 2. Podés seguir el avance suscribiéndote
              al newsletter mensual.
            </p>
          </div>
          <Link
            to="/newsletter"
            className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90"
          >
            Suscribirme al newsletter <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
