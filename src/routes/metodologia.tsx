import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { METHODOLOGY, DATA_SOURCE, kpis } from "@/lib/mock-data";
import { FlaskConical, Database, Ruler, GitCompareArrows, RefreshCw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/metodologia")({
  head: () => ({
    meta: [
      { title: "Metodología · PetroData" },
      { name: "description", content: "Cómo calculamos kbbl/d desde m³/mes, qué es una cohorte, cuándo se considera un pozo conectado, y política ante datos rectificados." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Documentación técnica"
        title="Metodología"
        description="Un producto de datos vive o muere por la trazabilidad de sus números. Acá está todo: fuente, conversiones, definiciones y política de rectificaciones."
      />
      <div className="p-6 space-y-6 max-w-4xl">
        <Section
          icon={Database}
          title="Fuente de datos"
        >
          <p>
            <strong className="text-foreground">{DATA_SOURCE}</strong>. Publicación pública, licencia CC-BY 4.0.
            Ingesta directa desde el datastore oficial de la Secretaría de Energía de la Nación
            (Capítulo IV: producción mensual por pozo · Adjunto IV: variables de completación).
          </p>
          <p>
            Corte actual del dataset: <span className="num text-foreground">{kpis.corte}</span>. El pipeline
            corre al día siguiente de cada publicación oficial. El último mes parcial se descarta.
          </p>
        </Section>

        <Section icon={Ruler} title="Conversiones y unidades">
          <ul className="space-y-2">
            <li>
              <strong className="text-foreground">Petróleo</strong>: <code className="num">m³ × {METHODOLOGY.m3_a_bbl}</code> → barriles.
              La producción mensual por pozo se divide por los días efectivos del mes → <code>bbl/día</code>. Se agrega y se muestra como <code>kbbl/d</code> (miles de barriles por día).
            </li>
            <li>
              <strong className="text-foreground">Gas</strong>: {METHODOLOGY.gas_unidad}. Se muestra como <code>MMm³/d</code> (millones de m³ por día).
            </li>
            <li>
              <strong className="text-foreground">Equivalencia energética</strong>: cuando se necesita comparar oil + gas usamos ~6,29 kboe / MMm³ (referencial, no se agrega automáticamente en la Overview).
            </li>
          </ul>
        </Section>

        <Section icon={GitCompareArrows} title="Cohortes vs. pozos conectados (importante)">
          <p>
            Publicamos dos indicadores relacionados que <strong className="text-foreground">no son comparables entre sí</strong>:
          </p>
          <ul className="space-y-2">
            <li>
              <strong className="text-foreground">Pozos conectados</strong>: pozo cuyo primer mes con
              <em> cualquier </em> producción (oil o gas) cae dentro del período reportado.
              Se usa en KPIs de actividad ("241 pozos YTD").
            </li>
            <li>
              <strong className="text-foreground">Cohortes</strong>: {METHODOLOGY.cohortes}.
              Se usa solo para curvas de declinación de petróleo. Excluye pozos exclusivamente gasíferos
              y filtra puntos con menos de 5 pozos por cohorte.
            </li>
          </ul>
          <p className="text-muted-foreground">
            Consecuencia: el conteo de "pozos" en un ranking de cohortes puede ser menor que
            "pozos conectados" del mismo año. Siempre citamos el criterio usado.
          </p>
        </Section>

        <Section icon={RefreshCw} title="Política ante datos rectificados">
          <p>
            La Secretaría de Energía rectifica retroactivamente meses ya publicados
            (correcciones de declaración, altas atrasadas, etc.). Nuestra política:
          </p>
          <ul className="space-y-2">
            <li>La serie completa se recalcula de cero en cada corrida — no cacheamos meses pasados.</li>
            <li>Si un mes sufre una rectificación mayor a ±5%, lo marcamos como "revisado" en el gráfico.</li>
            <li>Un mes con carga incompleta evidente (ej.: arena +200% MoM) se muestra como <em>preliminar</em>.</li>
          </ul>
        </Section>

        <Section icon={ShieldCheck} title="Qué no hacemos">
          <ul className="space-y-2">
            <li>No mezclamos capa de datos oficial con eventos editoriales — los eventos van en su propia sección con estado explícito.</li>
            <li>No inventamos rangos de guidance: el <em>Guidance tracker</em> solo publica cruces con fuente citada literal.</li>
            <li>No proyectamos producción futura sin marcar el modelo usado.</li>
          </ul>
        </Section>

        <Section icon={FlaskConical} title="Reproducibilidad">
          <p>
            Todos los cálculos derivan del dataset oficial linkeado arriba. Los usuarios Pro y
            Enterprise reciben el pipeline (código + queries) bajo NDA para reproducción interna.
          </p>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-display font-semibold">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground space-y-3 leading-relaxed [&_code]:text-foreground [&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs">
        {children}
      </div>
    </section>
  );
}
