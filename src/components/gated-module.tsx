import { Sparkles, Lock } from "lucide-react";
import { usePlan } from "@/lib/plan-context";
import { ProPill } from "@/components/pro-pill";

type Props = {
  children: React.ReactNode;
  title?: string;
  copy?: string;
  /** How to visually restrict the underlying content. Default: full blur overlay. */
  mode?: "overlay" | "peek";
  /** In "peek" mode, how tall the visible teaser is before the fade. */
  peekHeight?: number;
  className?: string;
};

/**
 * Wraps a module and, when the current plan is `free`, blurs the content and
 * overlays a CTA to upgrade to PRO. In `pro` demo mode the content renders
 * as-is.
 */
export function GatedModule({
  children,
  title = "Disponible en PetroData Pro",
  copy = "Activá el modo demo Pro (arriba a la derecha) para explorar este módulo con datos completos.",
  mode = "overlay",
  peekHeight = 180,
  className = "",
}: Props) {
  const { isPro, setPlan } = usePlan();

  if (isPro) {
    return (
      <div className={`relative ${className}`}>
        <ProCorner />
        {children}
      </div>
    );
  }

  if (mode === "peek") {
    return (
      <div className={`relative ${className}`}>
        <ProCorner locked />
        <div className="relative" style={{ maxHeight: peekHeight, overflow: "hidden" }}>
          <div>{children}</div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
            style={{
              background:
                "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-background) 92%, transparent))",
            }}
          />
        </div>
        <UpgradeStrip title={title} copy={copy} onClick={() => setPlan("pro")} />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <ProCorner locked />
      <div className="pointer-events-none select-none blur-sm opacity-60" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 grid place-items-center p-6">
        <UpgradeCard title={title} copy={copy} onClick={() => setPlan("pro")} />
      </div>
    </div>
  );
}

function ProCorner({ locked = false }: { locked?: boolean }) {
  return (
    <div className="absolute top-3 right-3 z-10">
      <ProPill locked={locked} />
    </div>
  );
}

function UpgradeCard({ title, copy, onClick }: { title: string; copy: string; onClick: () => void }) {
  return (
    <div className="max-w-sm rounded-lg border border-primary/30 bg-background/85 backdrop-blur-md p-5 text-center shadow-lg">
      <div className="mx-auto h-9 w-9 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
        <Lock className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3 font-display font-semibold">{title}</div>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{copy}</p>
      <button
        onClick={onClick}
        className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
      >
        <Sparkles className="h-3.5 w-3.5" /> Probar demo Pro
      </button>
    </div>
  );
}

function UpgradeStrip({
  title,
  copy,
  onClick,
}: {
  title: string;
  copy: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-3 rounded-md border border-primary/25 bg-primary/5 p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-2">
        <Lock className="h-4 w-4 text-primary mt-0.5" />
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-[11px] text-muted-foreground">{copy}</div>
        </div>
      </div>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
      >
        <Sparkles className="h-3 w-3" /> Probar demo Pro
      </button>
    </div>
  );
}
