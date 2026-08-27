import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  meta?: ReactNode;
}

export function ChartCard({ title, subtitle, actions, children, className, meta }: ChartCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card p-4 md:p-5 flex flex-col gap-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-semibold tracking-tight">{title}</h3>
          {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
      {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
    </section>
  );
}

export function ChartCardEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
