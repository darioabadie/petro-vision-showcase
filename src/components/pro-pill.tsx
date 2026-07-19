import { Sparkles, Lock } from "lucide-react";
import { usePlan } from "@/lib/plan-context";

export function ProPill({ locked = false, className = "" }: { locked?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${
        locked
          ? "border-primary/40 text-primary/70 bg-primary/5"
          : "border-primary text-primary bg-primary/10"
      } ${className}`}
    >
      {locked ? <Lock className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
      Pro
    </span>
  );
}

/** Button that is disabled + shows a PRO pill when plan=free. */
export function ProActionButton({
  children,
  onClick,
  icon: Icon,
  onUpgrade,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  onUpgrade?: () => void;
}) {
  const { isPro } = usePlan();
  return (
    <button
      onClick={isPro ? onClick : onUpgrade}
      className={`h-9 px-3 rounded-md border text-sm inline-flex items-center gap-1.5 transition-colors ${
        isPro
          ? "border-border hover:bg-muted"
          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary cursor-pointer"
      }`}
      title={isPro ? undefined : "Disponible en PetroData Pro"}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
      {!isPro && <ProPill locked />}
    </button>
  );
}
