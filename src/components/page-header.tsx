import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  as?: "h1" | "h2";
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Encabezado de sección: título, descripción y acciones a la derecha.
 * Incluye regeneración automática del scroll a top por ruta en el layout raíz.
 */
export function PageHeader({
  title,
  description,
  as = "h1",
  meta,
  actions,
  className,
}: PageHeaderProps) {
  const Heading = as;
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <Heading className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </Heading>
          {description && (
            <div className="mt-2 text-sm text-muted-foreground md:text-base">{description}</div>
          )}
          {meta && <div className="mt-3 flex flex-wrap gap-2 text-xs">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
