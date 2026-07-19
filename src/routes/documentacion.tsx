import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";

export const Route = createFileRoute("/documentacion")({
  head: () => ({
    meta: [
      { title: "Guía de tableros · PetroData" },
      {
        name: "description",
        content:
          "Descripción de cada tablero e indicador: fuente, fórmula, limitaciones y cómo leer cada número.",
      },
    ],
  }),
  component: Page,
});

// ─── datos ────────────────────────────────────────────────────
const TABLEROS = [
  {
    key: "overview",
    label: "Overview",
    indicators: [
      {
        id: "A1a",
        title: "Producción de petróleo",
        tooltip:
          "Producción de petróleo no convencional nacional en kbbl/d, al último mes completo del Capítulo IV.",
        description:
          "Suma de la producción mensual de petróleo (prod_pet, en m³) de todos los pozos no convencionales del país reportados al Capítulo IV, convertida a barriles (× 6,2898) y expresada como tasa diaria (÷ días del mes). Incluye shale y tight de todas las cuencas; ~90% corresponde a Vaca Muerta. Las variaciones MoM e YoY comparan contra el mes anterior y el mismo mes del año previo. El dato tiene ~1 mes de rezago respecto del calendario y puede ser rectificado por las operadoras en cargas posteriores.",
      },
      {
        id: "A1b",
        title: "Producción de gas",
        tooltip:
          "Producción de gas no convencional nacional en MM m³/d, al último mes completo del Capítulo IV.",
        description:
          "Suma de la producción mensual de gas (prod_gas, en miles de m³) de los pozos no convencionales, expresada como tasa diaria en millones de m³/día. Sensible a la estacionalidad invernal (los picos de demanda y el Plan Gas.Ar afectan el despacho): las comparaciones MoM de gas deben leerse con ese contexto.",
      },
      {
        id: "A3y",
        title: "Pozos conectados YTD",
        tooltip:
          "Pozos que registraron su primera producción en lo que va del año, comparado con el mismo período del año anterior.",
        description:
          "Conteo de pozos cuyo primer mes con producción (petróleo o gas > 0) en el Capítulo IV cae dentro del año en curso, acumulado hasta el último mes completo. La comparación interanual usa el mismo rango de meses del año previo. Es el mejor proxy público del ritmo de puesta en marcha: la SE no publica datos de perforación (no existe rig count oficial), por lo que este indicador —junto con las etapas de fractura— es el termómetro de actividad del sector. Nota: el criterio («cualquier producción») difiere del usado en cohortes («primera producción de petróleo»); ambos conteos no son comparables entre sí.",
      },
      {
        id: "A8a",
        title: "Arena bombeada",
        tooltip:
          "Toneladas de arena de fractura bombeadas en el mes, según el Adjunto IV. Dato preliminar con rezago de carga.",
        description:
          "Suma de arena_bombeada_nacional_tn + arena_bombeada_importada_tn de los trabajos de fractura cuya fecha de finalización cae en el mes. Es el indicador de demanda de la cadena de suministro de arena (minas, logística, transporte). Limitación importante: el Adjunto IV carga con rezago irregular — el mes más reciente puede aparecer inflado o desinflado hasta que se completa la carga (caso validado: salto de +207% MoM por subreporte del mes anterior). Se publica siempre con la etiqueta «preliminar» y se recomienda leerlo con un mes de rezago.",
      },
      {
        id: "A8b",
        title: "Etapas promedio por pozo",
        tooltip:
          "Cantidad promedio de etapas de fractura por pozo horizontal terminado en el período.",
        description:
          "Promedio de cantidad_fracturas (etapas) de los pozos con fractura finalizada en el período, según el Adjunto IV. Es la medida más directa de la intensidad de completación: más etapas implican mayor contacto con la roca y mayor costo de terminación. Su evolución histórica (de ~20 etapas en 2018 a más de 50 hoy) cuenta la historia de la optimización técnica de Vaca Muerta.",
      },
      {
        id: "A8c",
        title: "Rama lateral promedio",
        tooltip:
          "Longitud horizontal promedio (en metros) de los pozos fracturados en el período.",
        description:
          "Promedio de longitud_rama_horizontal_m de los pozos con fractura finalizada en el período. Junto con las etapas, define el «tamaño» del pozo típico. La tendencia a ramas más largas (3.000+ m) replica la evolución del shale norteamericano y es clave para normalizar comparaciones de productividad entre pozos y entre años.",
      },
      {
        id: "A8d",
        title: "Arena importada (%)",
        tooltip:
          "Porcentaje de la arena bombeada que es importada. La industria migró a arena 100% nacional.",
        description:
          "arena_importada / arena_total del período. Indicador de sustitución de importaciones de la cadena de valor: en los inicios de Vaca Muerta la arena de fractura era mayormente importada; hoy domina la arena nacional (Entre Ríos y otras fuentes). Un rebote de este indicador sería una señal de cuello de botella en la oferta local.",
      },
      {
        id: "A8e",
        title: "Ratio de completación (tn/pozo)",
        tooltip:
          "Arena promedio bombeada por pozo terminado en el mes, en toneladas.",
        description:
          "Arena total del período dividida por la cantidad de pozos con fractura finalizada. Mide la intensidad de arena del diseño de completación promedio. Hereda la limitación de rezago del dato de arena.",
      },
      {
        id: "A1c",
        title: "Serie mensual de producción",
        tooltip:
          "Evolución de la producción no convencional de petróleo y gas de los últimos 24 meses.",
        description:
          "Series mensuales de producción de petróleo (kbbl/d) y gas (MM m³/d) no convencionales, calculadas con la metodología de A1a y A1b. La ventana de 24 meses muestra la tendencia sin ruido de largo plazo. Los últimos 1–2 puntos pueden moverse levemente por rectificaciones de las operadoras.",
      },
      {
        id: "A1d",
        title: "Ranking de producción por operadora",
        tooltip:
          "Operadoras ordenadas por producción de petróleo no convencional del último mes, con su participación sobre el total.",
        description:
          "Producción de petróleo del último mes completo agregada por empresa operadora (quien reporta el pozo al Capítulo IV, no necesariamente el único socio del área), con el share sobre el total nacional. Los nombres se normalizan mediante una tabla de alias (ej.: «Vista Oil & Gas» y «Vista Energy» son la misma empresa; Pluspetrol S.A. y Pluspetrol Cuenca Neuquina S.R.L. se muestran por separado porque reportan como entidades distintas). El ranking refleja producción operada: la participación económica de cada socio en un área puede diferir.",
      },
      {
        id: "A5",
        title: "Curva de declinación por cohorte",
        tooltip:
          "Producción promedio por pozo según sus meses en producción, agrupando los pozos por año de puesta en marcha.",
        description:
          "Cada cohorte agrupa los pozos cuya primera producción de petróleo ocurrió en un mismo año calendario. Para cada mes de «edad» (meses desde la primera producción) se calcula la producción promedio por pozo (bbl/d, usando 30,44 días/mes). La forma de la curva es la típica del shale: pico entre el segundo y tercer mes, luego declinación pronunciada. Comparar cohortes muestra si las nuevas generaciones de pozos rinden más. Solo se publican puntos con más de 5 pozos para evitar ruido estadístico. Advertencia: las cohortes recientes están sesgadas hacia sus mejores meses (los pozos más nuevos aún no aportaron meses tardíos).",
      },
      {
        id: "A4",
        title: "Fracturados sin conectar",
        tooltip:
          "Pozos con fractura terminada que aún no registraron primera producción. Inventario de conexión pendiente por operadora.",
        description:
          "Pozos con fecha_fin_fractura registrada en el Adjunto IV y sin primera producción en el padrón del Capítulo IV, agrupados por operadora. Es el buffer de producción de corto plazo: pozos listos que esperan facilities o conexión. La columna «buffer» expresa ese inventario en meses de conexiones al ritmo reciente de cada operadora (FsC ÷ conexiones promedio mensuales). Por qué no lo llamamos «DUCs»: el DUC clásico (drilled but uncompleted) es un pozo perforado sin fracturar, y ese estadio no es observable en fuentes públicas — la SE no publica datos de perforación. Nuestro indicador captura el estadio siguiente (fracturado sin conectar), que para anticipar producción de corto plazo es incluso más accionable.",
      },
    ],
  },
  {
    key: "actividad",
    label: "Actividad & DUCs",
    indicators: [
      {
        id: "A2",
        title: "Etapas de fractura del mes — métrica insignia",
        tooltip:
          "Etapas de fractura completadas en el mes según el Adjunto IV oficial. El indicador de actividad más citado del sector.",
        description:
          "Suma de cantidad_fracturas de todos los trabajos cuya fecha_fin_fractura cae en el mes. Es la métrica de actividad de referencia en Vaca Muerta —la que la prensa especializada publica mensualmente citando relevamientos privados de empresas de servicios—, calculada acá desde el dato oficial del Adjunto IV, que se actualiza a diario. Diferencias posibles con los relevamientos privados: el Adjunto IV registra por fecha de fin de trabajo y puede traer ~1 mes de rezago de carga; los relevamientos de campo cuentan etapas al momento de ejecución. La serie histórica permite ver estacionalidad (paradas de enero, picos de fin de año) y el ciclo de actividad contra el precio del crudo.",
      },
      {
        id: "A3m",
        title: "Pozos conectados del mes",
        tooltip:
          "Pozos que registraron su primera producción en el mes. Proxy oficial del ritmo de puesta en marcha.",
        description:
          "Versión mensual del indicador A3y: pozos cuyo primer mes con producción cae en el período. Leído junto con las etapas (A2) permite inferir si la industria está completando más rápido de lo que conecta (crece el inventario FsC) o drenando inventario (conecta más de lo que fractura).",
      },
      {
        id: "B1",
        title: "Sets de fractura activos — estimado",
        tooltip:
          "Equipos de fractura operando en simultáneo, estimados por solapamiento de fechas de trabajos en el Adjunto IV. Siempre «estimado».",
        description:
          "La SE no informa equipos de fractura. Este indicador estima los «sets» activos contando, para cada día, cuántos trabajos del Adjunto IV tienen fechas de inicio/fin que se solapan; el valor mensual es el promedio de esa serie diaria. Es el equivalente conceptual del frac spread count que publica Primary Vision para EE.UU. con relevamiento de campo. Limitaciones: asume un equipo por trabajo (un set que salta entre pads puede contarse doble; trabajos simultáneos del mismo pad pueden compartir set), y hereda el rezago de carga del Adjunto IV. Por eso se publica siempre como «estimado» y nunca como dato de campo.",
      },
      {
        id: "B3",
        title: "Etapas por pozo conectado",
        tooltip:
          "Etapas de fractura del mes divididas por pozos conectados. Intensidad de completación versus puesta en marcha.",
        description:
          "Cociente entre A2 y A3m. Sube cuando los pozos nuevos son más intensivos (más etapas por pozo) o cuando la conexión se atrasa respecto de la completación; baja cuando se conecta inventario acumulado. Útil como señal temprana de cuellos de botella en facilities/evacuación, leída junto con el inventario FsC (A4).",
      },
      {
        id: "A8",
        title: "Parámetros técnicos promedio nacional",
        tooltip:
          "Diseño de completación promedio del período: etapas, rama lateral, arena por pozo y origen de la arena.",
        description:
          "Panel que agrupa los indicadores de intensidad de completación (A8b, A8c, A8d, A8e) para el pozo horizontal no convencional promedio del período. Es la foto del «pozo tipo» que la industria está terminando hoy, y su evolución trimestral es el mejor resumen técnico de hacia dónde va el diseño de pozos en Vaca Muerta.",
      },
    ],
  },
  {
    key: "operadoras",
    label: "Fichas de operadora",
    indicators: [
      {
        id: "A1-op",
        title: "KPIs de cabecera",
        tooltip:
          "Producción operada de petróleo y gas del último mes, pozos activos y áreas operadas.",
        description:
          "Producción de petróleo (kbbl/d) y gas (MM m³/d) de todos los pozos no convencionales operados por la empresa en el último mes completo, con variación MoM y conteo de pozos con producción en el mes («pozos activos» = pozos que reportaron volumen > 0, no pozos existentes). La ficha consolida los alias de la empresa (razones sociales históricas) según la tabla de normalización.",
      },
      {
        id: "A1-op-serie",
        title: "Serie histórica de la operadora",
        tooltip:
          "Evolución mensual de la producción operada de petróleo y gas desde 2018 (últimos 36 meses).",
        description:
          "Misma metodología que la serie nacional, filtrada por empresa operadora. Los saltos discretos suelen corresponder a cesiones de áreas o cambios de operador — no a producción física; el corte por razón social se documenta en la tabla de alias. Se muestran oil (kbbl/d) y gas (MM m³/d) en el mismo gráfico con ejes compartidos.",
      },
      {
        id: "A1-op-areas",
        title: "Áreas operadas",
        tooltip:
          "Áreas/concesiones donde la empresa reporta pozos con producción reciente.",
        description:
          "Listado de áreas (concesiones de explotación no convencional) donde la empresa reportó producción desde el año anterior, ordenadas por volumen, con link a la ficha de cada área. Refleja operación, no titularidad: los socios no operadores de un consorcio no aparecen en el Capítulo IV con sus propios pozos.",
      },
    ],
  },
  {
    key: "areas",
    label: "Fichas de área",
    indicators: [
      {
        id: "A1-area",
        title: "KPIs de cabecera",
        tooltip:
          "Producción del área en el último mes, pozos activos, cuenca, provincia y fecha de primera producción no convencional.",
        description:
          "Producción de petróleo y gas del área en el último mes completo, cantidad de pozos con producción, y metadatos de contexto (cuenca, provincia, primera producción NC registrada en el Capítulo IV — indicador de madurez del bloque). La concesión hasta indica el año de vencimiento reportado; las prórrogas bajo RIGI pueden extender ese plazo.",
      },
      {
        id: "A1-area-serie",
        title: "Serie histórica del área",
        tooltip:
          "Evolución mensual de la producción del área desde 2018.",
        description:
          "Producción mensual agregada de todos los pozos del área. La forma de la curva revela la fase del bloque: rampa (desarrollo activo), plateau (equilibrio perforación/declinación) o declinación (desarrollo pausado). Cruzarla con las conexiones de pozos del área explica cada quiebre.",
      },
      {
        id: "A8-area",
        title: "Completación promedio (Adjunto IV)",
        tooltip:
          "Etapas, arena y rama lateral promedio de los pozos fracturados en el área.",
        description:
          "Promedio de cantidad_fracturas, arena_bombeada y longitud_rama_horizontal_m de los pozos del área con fractura finalizada en el período. Permite comparar la intensidad de completación entre áreas y detectar si una operadora está siendo más o menos agresiva en su diseño. Los promedios nacionales se usan como benchmark en fichas donde aún no hay dato desagregado por área en el Adjunto IV.",
      },
      {
        id: "A5-area",
        title: "Declinación por cohorte del área",
        tooltip:
          "Curva tipo de declinación usando las cohortes nacionales como referencia para el área.",
        description:
          "Las curvas de declinación se calculan actualmente con datos nacionales agregados (no por área) porque el volumen de pozos por área y por cohorte genera ruido estadístico. En fichas individuales el gráfico sirve como contexto de cohortes nacionales. La versión desagregada por área está en el roadmap para áreas con más de 30 pozos por cohorte.",
      },
    ],
  },
];

const CONVENCIONES = [
  {
    label: "Fuente",
    text: "Secretaría de Energía de la Nación — Capítulo IV (producción por pozo, mensual) y Adjunto IV (datos de fractura, actualización diaria). Licencia CC-BY 4.0.",
  },
  {
    label: "Conversiones",
    text: "Petróleo: m³ × 6,2898 = bbl. Tasas diarias = volumen mensual ÷ días calendario del mes. Gas: miles de m³/mes → MM m³/d.",
  },
  {
    label: "Rezago y cortes",
    text: "El último mes se descarta si su carga es parcial (<60% del mes anterior). Todo dato del Adjunto IV puede llegar con ~1 mes de rezago y se marca «preliminar».",
  },
  {
    label: "Alcance «VM»",
    text: "«VM» refiere a producción no convencional nacional (shale + tight), cuyo ~90% proviene de Vaca Muerta. No equivale a «toda la producción de Vaca Muerta».",
  },
  {
    label: "Rectificaciones",
    text: "La SE rectifica retroactivamente meses ya publicados. La serie se recalcula de cero en cada corrida del pipeline — no se cachean meses pasados.",
  },
];

// ─── componentes ──────────────────────────────────────────────
function IndicatorCard({
  id,
  title,
  tooltip,
  description,
}: {
  id: string;
  title: string;
  tooltip: string;
  description: string;
}) {
  return (
    <div className="panel p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/15 text-primary border border-primary/30 mt-0.5">
          {id}
        </span>
        <h3 className="font-display font-semibold leading-snug">{title}</h3>
      </div>
      <div className="flex items-start gap-2 border-l-2 border-primary pl-3 py-0.5">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-foreground leading-relaxed">{tooltip}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function Page() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Documentación"
        title="Guía de tableros e indicadores"
        description="Fuente, fórmula, limitaciones y cómo leer cada número. Cada entrada corresponde a un módulo o KPI visible en la interfaz."
      />

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Convenciones generales */}
        <div className="panel p-5">
          <div className="text-[11px] uppercase tracking-widest text-primary font-medium mb-3">
            Convenciones generales · aplican a todos los tableros
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {CONVENCIONES.map((c) => (
              <div key={c.label}>
                <dt className="text-xs font-semibold text-foreground mb-0.5">{c.label}</dt>
                <dd className="text-xs text-muted-foreground leading-relaxed">{c.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Tabs por tablero */}
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto gap-1">
            {TABLEROS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABLEROS.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-4 space-y-3">
              {t.indicators.map((ind) => (
                <IndicatorCard key={ind.id} {...ind} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}
