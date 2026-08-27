import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { StatesWrapper } from "@/components/states";
import { ChartCard } from "@/components/chart-card";
import { formatNumber } from "@/lib/format";
import { PALETTE, SERIES_COLORS } from "@/lib/palette";
import type {
  GeoJsonFeatureCollection,
  MapViewState,
  MapWellProperties,
  TrajectoryProperties,
} from "@/lib/contract";

import "maplibre-gl/dist/maplibre-gl.css";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Pulso Vaca Muerta · Mapa" },
      {
        name: "description",
        content:
          "Mapa de pozos y trayectorias por operador, área y formación en Vaca Muerta, con modos de color y fallback de tabla.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <StatesWrapper ready={(data) => <Loaded data={data} />} />
    </div>
  );
}

function Loaded({ data }: { data: import("@/lib/contract").ObservatoryData }) {
  const mapData = data.map;
  const [mode, setMode] = useState<string>(mapData.color_modes[0] ?? "wells");
  const [showTable, setShowTable] = useState(false);

  return (
    <>
      <PageHeader
        title="Mapa"
        description="Ubicación de pozos y trayectorias laterales. El color de los puntos se puede cambiar por modo; si el navegador no soporta WebGL se muestra una tabla equivalente."
        meta={
          <>
            <span>{mapData.wells_geojson.features.length} pozos</span>
            <span className="text-muted-foreground">
              · {mapData.trajectories_geojson.features.length} trayectorias
            </span>
          </>
        }
        actions={
          <>
            <Select value={mode} onValueChange={(v) => setMode(v)}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Modo de color" />
              </SelectTrigger>
              <SelectContent>
                {mapData.color_modes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {modeLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="h-9 rounded-md border border-input px-3 text-sm transition-colors hover:border-primary/50"
            >
              {showTable ? "Ver mapa" : "Ver tabla"}
            </button>
          </>
        }
      />

      {showTable ? (
        <WellTable wells={mapData.wells_geojson} />
      ) : (
        <MapView
          wells={mapData.wells_geojson}
          trajectories={mapData.trajectories_geojson}
          initialView={mapData.initial_view}
          mode={mode}
        />
      )}
    </>
  );
}

function modeLabel(mode: string): string {
  switch (mode) {
    case "wells":
      return "Por producción";
    case "operator":
      return "Por operador";
    case "area":
      return "Por área";
    default:
      return mode;
  }
}

type MapboxExpr = string | number | MapboxExpr[];

function addWellPopup(
  map: import("maplibre-gl").Map,
  wells: GeoJsonFeatureCollection<MapWellProperties>,
  Popup: typeof import("maplibre-gl").Popup,
) {
  map.on("click", "wells", (e) => {
    const props = (e.features?.[0]?.properties ?? {}) as Partial<MapWellProperties>;
    new Popup({ offset: 14 })
      .setLngLat(e.lngLat)
      .setHTML(
        `<div class="px-1 py-0.5">
          <div class="font-medium">${esc(props.label ?? props.well_id ?? "Pozo")}</div>
          <div class="text-xs text-muted-foreground">${esc(props.operator_name ?? "")} · ${esc(props.area ?? "")} · ${esc(props.formation ?? "")}</div>
          <div class="mt-1 text-xs tabular-nums">Petróleo: ${formatNumber(props.last_oil_m3 ?? 0)} m³ · Gas: ${formatNumber(props.last_gas_thousand_m3 ?? 0)} miles m³</div>
        </div>`,
      )
      .addTo(map);
  });
  map.on("mouseenter", "wells", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "wells", () => {
    map.getCanvas().style.cursor = "";
  });
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function MapView({
  wells,
  trajectories,
  initialView,
  mode,
}: {
  wells: GeoJsonFeatureCollection<MapWellProperties>;
  trajectories: GeoJsonFeatureCollection<TrajectoryProperties>;
  initialView: MapViewState;
  mode: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{
    setPaintProperty: (id: string, p: string, v: MapboxExpr) => void;
    remove: () => void;
  } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let map: import("maplibre-gl").Map | null = null;
    (async () => {
      const { Map, Popup } = await import("maplibre-gl");
      if (disposed || !containerRef.current) return;
      try {
        map = new Map({
          container: containerRef.current,
          center: [initialView.longitude, initialView.latitude],
          zoom: initialView.zoom,
          style: buildMapStyle(wells, trajectories, mode),
        } as unknown as import("maplibre-gl").MapOptions);
        map.on("load", () => {
          addWellPopup(map as unknown as import("maplibre-gl").Map, wells, Popup);
        });
        mapRef.current = {
          setPaintProperty: (id: string, p: string, v: MapboxExpr) =>
            map?.setPaintProperty(id as never, p as never, v as never),
          remove: () => map?.remove(),
        };
      } catch {
        setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    try {
      mapRef.current.setPaintProperty("wells", "circle-color", colorExpr(mode, wells));
    } catch {
      // el mapa se inicializó en otro modo; se ignora.
    }
  }, [mode, wells]);

  if (failed) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        Tu navegador no soporta WebGL. Usá la vista de tabla para inspeccionar los pozos.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[520px] w-full overflow-hidden rounded-lg border border-border"
    />
  );
}

function buildMapStyle(
  wells: GeoJsonFeatureCollection<MapWellProperties>,
  trajectories: GeoJsonFeatureCollection<TrajectoryProperties>,
  mode: string,
) {
  return {
    version: 8 as const,
    sources: {
      base: {
        type: "raster" as const,
        tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap © CARTO",
        maxzoom: 19,
      },
      trajectories: {
        type: "geojson" as const,
        data: trajectories as never,
      },
      wells: {
        type: "geojson" as const,
        data: wells as never,
      },
    },
    layers: [
      {
        id: "base",
        type: "raster" as const,
        source: "base",
        paint: {},
      },
      {
        id: "trajectories",
        type: "line" as const,
        source: "trajectories",
        layout: { "line-join": "round" as const, "line-cap": "round" as const },
        paint: {
          "line-color": PALETTE.oil,
          "line-opacity": 0.5,
          "line-width": 1.5,
        },
      },
      {
        id: "wells",
        type: "circle" as const,
        source: "wells",
        paint: {
          "circle-radius": 6,
          "circle-color": colorExpr(mode, wells),
          "circle-stroke-color": "oklch(0.2 0.008 240)",
          "circle-stroke-width": 1,
        },
      },
    ],
  };
}

function colorExpr(mode: string, wells: GeoJsonFeatureCollection<MapWellProperties>) {
  const features = wells.features;
  const maxOil = Math.max(0, ...features.map((f) => f.properties?.last_oil_m3 ?? 0));
  const mid = maxOil * 0.45;
  const step: MapboxExpr[] = [
    "step",
    ["coalesce", ["get", "last_oil_m3"], 0],
    PALETTE.neutral,
    mid,
    PALETTE.water,
    maxOil * 0.9,
    PALETTE.oil,
  ];
  const modeExpr =
    mode === "operator"
      ? (() => {
          const operators = [
            ...new Set(features.map((f) => f.properties?.operator_slug ?? "unknown")),
          ];
          const match: MapboxExpr[] = ["match", ["get", "operator_slug"]];
          operators.forEach((op, i) => {
            match.push(op, SERIES_COLORS[i % SERIES_COLORS.length]);
          });
          match.push(PALETTE.neutral);
          return match;
        })()
      : mode === "area"
        ? (() => {
            const areas = [...new Set(features.map((f) => f.properties?.area ?? "unknown"))];
            const match: MapboxExpr[] = ["match", ["get", "area"]];
            for (const area of areas) {
              match.push(area, PALETTE.oil);
            }
            match.push(PALETTE.water);
            return match;
          })()
        : step;
  return modeExpr;
}

function WellTable({ wells }: { wells: GeoJsonFeatureCollection<MapWellProperties> }) {
  const rows = wells.features.map((f) => f.properties).filter(Boolean) as MapWellProperties[];
  return (
    <ChartCard title="Pozos (vista de tabla)" subtitle="Datos de ubicación y último mes publicado.">
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Pozo</th>
              <th className="px-3 py-2">Operador</th>
              <th className="px-3 py-2">Área</th>
              <th className="px-3 py-2">Formación</th>
              <th className="px-3 py-2 text-right">Último petróleo (m³)</th>
              <th className="px-3 py-2 text-right">Último gas (miles m³)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.well_id} className="border-b border-border/60 hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{w.label}</td>
                <td className="px-3 py-2">{w.operator_name}</td>
                <td className="px-3 py-2">{w.area}</td>
                <td className="px-3 py-2 text-muted-foreground">{w.formation}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatNumber(w.last_oil_m3)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {formatNumber(w.last_gas_thousand_m3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
