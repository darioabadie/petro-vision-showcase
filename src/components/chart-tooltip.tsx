import { formatCompact, formatMonth, formatNumber } from "@/lib/format";

export interface ChartTooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
  stroke?: string;
  fill?: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string | number;
  unit?: string;
  labelFormatter?: (label: string | number) => string;
  compactValues?: boolean;
}

/**
 * Tooltip por defecto para los gráficos Recharts. Formatea el label como
 * período es-AR y los valores con el unit indicado.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  unit,
  labelFormatter,
  compactValues = false,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const color = payload[0]?.color ?? payload[0]?.stroke ?? payload[0]?.fill;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium text-foreground">
        {labelFormatter ? labelFormatter(String(label)) : formatMonth(String(label))}
      </div>
      <ul className="space-y-0.5">
        {payload.map((entry, index) => (
          <li key={`${entry.dataKey ?? index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {entry.color || entry.stroke || color ? (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: entry.color ?? entry.stroke ?? color ?? "var(--primary)",
                  }}
                />
              ) : null}
              {String(entry.name ?? "")}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {formatNumberValue(Number(entry.value), compactValues)}
              {unit ? ` ${unit}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatNumberValue(value: number, compact: boolean): string {
  const abs = Math.abs(value);
  return compact && abs >= 1000 ? formatCompact(value) : formatNumber(value);
}
