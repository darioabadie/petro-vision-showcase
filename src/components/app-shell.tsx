import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  Download,
  FlaskConical,
  Github,
  Layers,
  LineChart as LineChartIcon,
  Map as MapIcon,
  Menu,
  Radar,
  LayoutDashboard,
  X,
  Waves,
  AlertTriangle,
} from "lucide-react";
import { useObservatoryData } from "@/lib/observatory-data";

const primaryNav = [
  { to: "/", label: "Resumen", icon: LayoutDashboard },
  { to: "/produccion", label: "Producción", icon: LineChartIcon },
  { to: "/operadores", label: "Operadores", icon: Building2 },
  { to: "/pozos-y-cohortes", label: "Pozos", icon: Layers },
  { to: "/fracturas", label: "Fracturas", icon: Activity },
  { to: "/mapa", label: "Mapa", icon: MapIcon },
  { to: "/calidad", label: "Calidad", icon: Radar },
];

const secondaryNav = [
  { to: "/metodologia", label: "Metodología", icon: FlaskConical },
  { to: "/descargas", label: "Descargas", icon: Download },
];

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0">
      <div className="relative h-9 w-9 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
        <Waves className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
      </div>
      <div className="leading-none">
        <div className="font-display text-base font-semibold tracking-tight">
          Pulso <span className="text-primary">Vaca Muerta</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
          Observatorio de hidrocarburos
        </div>
      </div>
    </Link>
  );
}

export function MockBanner() {
  const { data } = useObservatoryData();
  if (!data?.release.is_mock) return null;
  return (
    <div
      role="status"
      className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-center text-xs text-foreground"
    >
      <span className="inline-flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
        Versión demostrativa · Los datos son sintéticos y no representan cifras reales
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data } = useObservatoryData();
  const [menuOpen, setMenuOpen] = useState(false);

  const site = data?.site;
  const cutoff = data?.release.data_cutoff;

  const renderNavLinks = (items: typeof primaryNav, vertical = false) =>
    items.map((item) => {
      const Active = isActivePath(pathname, item.to);
      return (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setMenuOpen(false)}
          className={`flex items-center gap-2 rounded-md text-sm transition-colors ${
            vertical ? "px-3 py-2" : "h-9 px-3"
          } ${
            Active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      );
    });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="flex h-16 items-center gap-4">
            <Brand />

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 px-4">
              {renderNavLinks(primaryNav)}
              <div className="mx-1 h-5 w-px bg-border" />
              {renderNavLinks(secondaryNav)}
            </nav>

            <div className="flex-1 lg:hidden" />

            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              {site && (
                <a
                  href={site.repository_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 h-9 hover:border-primary/50 hover:text-foreground transition-colors"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
              )}
              {cutoff && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 h-9">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                  Corte {formatCutoff(cutoff)}
                </span>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-input text-foreground"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="lg:hidden border-t border-border bg-background px-3 py-3 space-y-0.5">
            {renderNavLinks(primaryNav, true)}
            <div className="h-px bg-border my-2" />
            {renderNavLinks(secondaryNav, true)}
          </nav>
        )}
      </header>

      {/* Banner de maqueta */}
      <MockBanner />

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-5 text-xs text-muted-foreground mt-12">
        <div className="mx-auto max-w-[1400px] flex flex-wrap gap-x-6 gap-y-2 justify-between">
          <div className="space-y-1">
            <div>{site?.name ?? "Pulso Vaca Muerta"}</div>
            <div>{site?.source_label ?? ""}</div>
          </div>
          <div className="space-y-1 text-right">
            {cutoff && <div>Fecha de corte: {formatCutoff(cutoff)}</div>}
            {data?.release && (
              <div>
                Release {data.release.release_id} · {data.release.status}
              </div>
            )}
          </div>
          <div className="w-full text-left md:text-right md:w-auto">
            Proyecto independiente construido sobre datos públicos. No constituye asesoramiento de
            inversión.
          </div>
        </div>
      </footer>
    </div>
  );
}

function formatCutoff(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
