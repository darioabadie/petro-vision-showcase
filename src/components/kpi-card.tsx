import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  displayValue?: string | null;
  unit?: string | null;
  value?: number;
  changeMoM?: number | null;
  changeYoY?: number | null;
  status?: string | null;
  definition?: string;
  children?: ReactNode;
  className?: string;
}

function ChangeBadge({ pct }: { pct: number | null | undefined }) {
  if (pct === null || pct === undefined || Number.isNaN(Number(pct))) return null;
  const positive = pct > 0;
  const negative = pct < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
        positive && "text-emerald-400 bg-emerald-400/10",
        negative && "text-red-400 bg-red-400/10",
        !positive && !negative && "text-muted-foreground bg-muted",
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(pct).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%
    </span>
  );
}

export function KpiCard({
  label,
  displayValue,
  unit,
  definition,
  changeMoM,
  changeYoY,
  status,
  children,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn("flex flex-col gap-2 rounded-lg border border-border bg-card p-4", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {status && status !== "ok" && (
          <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-warning">
            {status}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-semibold tracking-tight tabular-nums">
          {displayValue ?? (children as ReactNode)}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {(changeMoM !== undefined || changeYoY !== undefined) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {changeMoM !== undefined && (
            <span className="text-muted-foreground">
              MoM <ChangeBadge pct={changeMoM} />
            </span>
          )}
          {changeYoY !== undefined && (
            <span className="text-muted-foreground">
              YoY <ChangeBadge pct={changeYoY} />
            </span>
          )}
        </div>
      )}
      {children}
      {definition && (
        <div className="mt-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          {definition}
        </div>
      )}
    </div>
  );
}
