import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  MapPinned,
  BookOpen,
  Mail,
  Sparkles,
  Search,
  Database,
  FlaskConical,
  Activity,
} from "lucide-react";
import { LAST_UPDATE, META_GENERADO } from "@/lib/mock-data";
import { PlanToggle } from "@/components/plan-toggle";
import { usePlan } from "@/lib/plan-context";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/actividad", label: "Actividad & DUCs", icon: Activity },
  { to: "/operadoras", label: "Operadoras", icon: Building2 },
  { to: "/areas", label: "Áreas", icon: MapPinned },
  { to: "/metodologia", label: "Metodología", icon: FlaskConical },
  { to: "/wiki", label: "Wiki & Glosario", icon: BookOpen },
  { to: "/newsletter", label: "Newsletter", icon: Mail },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <Database className="h-4 w-4 text-primary" />
              <div className="absolute inset-0 rounded-md" style={{ boxShadow: "var(--shadow-glow)" }} />
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-tight leading-none">
                Petro<span className="text-primary">Data</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                Vaca Muerta Intelligence
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const Active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  Active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary pl-[10px]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link
            to="/pro"
            className="group flex items-center gap-2 rounded-md p-3 bg-primary/10 border border-primary/25 hover:bg-primary/15 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">PetroData Pro</div>
              <div className="text-[11px] text-muted-foreground">Alertas, API, exports</div>
            </div>
          </Link>
          <div className="mt-3 text-[10px] text-muted-foreground px-1 flex items-center justify-between">
            <span>Última actualización</span>
            <span className="text-primary font-mono">{LAST_UPDATE}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-border bg-background/70 backdrop-blur sticky top-0 z-10 flex items-center px-4 md:px-6 gap-4">
          <div className="md:hidden font-display font-semibold">
            Petro<span className="text-primary">Data</span>
          </div>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar operadora, área, evento…"
              className="w-full h-9 rounded-md border border-input bg-input/50 pl-9 pr-3 text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
              Pipeline OK
            </span>
            <span className="font-mono">{META_GENERADO.replace("T", " ")} ART</span>
          </div>
          <PlanToggle />
          <PlanAwareCTAs />
        </header>

        <main className="flex-1 grid-bg">{children}</main>

        <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground flex flex-wrap gap-4 justify-between">
          <div>
            © 2026 PetroData · Datos: Secretaría de Energía de la Nación (Capítulo IV / Adjunto IV)
          </div>
          <div className="font-mono">MVP demo · Todos los números son ilustrativos</div>
        </footer>
      </div>
    </div>
  );
}

function PlanAwareCTAs() {
  const { isPro } = usePlan();
  if (isPro) {
    return (
      <span className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 text-primary px-3 h-9 text-sm font-medium">
        <Sparkles className="h-3.5 w-3.5" /> Demo Pro activa
      </span>
    );
  }
  return (
    <>
      <Link
        to="/pro"
        className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-primary/40 text-primary px-3 h-9 text-sm font-medium hover:bg-primary/10"
      >
        Lista de espera Pro
      </Link>
      <Link
        to="/newsletter"
        className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-9 text-sm font-medium hover:opacity-90"
      >
        <Mail className="h-3.5 w-3.5" /> Suscribirme
      </Link>
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border px-6 py-6 md:py-8 flex flex-wrap gap-4 items-end justify-between">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-widest text-primary font-medium mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{description}</p>
        )}
      </div>
      {right}
    </div>
  );
}

export function Stat({
  label,
  value,
  delta,
  unit,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  unit?: string;
  hint?: string;
}) {
  const positive = delta?.startsWith("+");
  return (
    <div className="panel p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="num text-2xl font-semibold">{value}</div>
        {unit && <div className="text-xs text-muted-foreground">{unit}</div>}
      </div>
      <div className="mt-1 flex items-center justify-between">
        {delta && (
          <div
            className={`num text-xs ${
              positive ? "text-primary" : "text-destructive"
            }`}
          >
            {delta}
          </div>
        )}
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}
