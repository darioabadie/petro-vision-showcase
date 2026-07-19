import { Sparkles } from "lucide-react";
import { usePlan } from "@/lib/plan-context";

export function PlanToggle() {
  const { plan, setPlan } = usePlan();
  return (
    <div className="hidden md:inline-flex items-center rounded-md border border-border bg-input/40 p-0.5 text-xs">
      <button
        onClick={() => setPlan("free")}
        className={`px-2.5 h-7 rounded-[5px] transition-colors ${
          plan === "free"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Free
      </button>
      <button
        onClick={() => setPlan("pro")}
        className={`px-2.5 h-7 rounded-[5px] inline-flex items-center gap-1 transition-colors ${
          plan === "pro"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-primary hover:text-primary"
        }`}
        title="Activar demo del plan Pro"
      >
        <Sparkles className="h-3 w-3" />
        Pro <span className="text-[9px] uppercase tracking-widest opacity-70">demo</span>
      </button>
    </div>
  );
}
