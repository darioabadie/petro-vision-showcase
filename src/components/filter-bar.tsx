import { useRef, useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExplorerFilters } from "@/lib/explorer";
import type { ObservatoryData } from "@/lib/contract";

export type ProductOption = { id: string; label: string; unit: string };

/** Construye las opciones del FilterBar a partir del payload del contrato. */
export function filterDepsFromData(data: ObservatoryData): FilterDeps {
  const f = data.filter_options;
  return {
    products: f.products,
    periods: f.periods,
    operators: f.operators,
    areas: f.areas,
    basins: f.basins,
    provinces: f.provinces,
    formations: f.formations,
    resourceTypes: f.resource_types,
    resourceSubtypes: f.resource_subtypes,
  };
}

export interface FilterDeps {
  products: ProductOption[];
  periods: string[];
  operators: { slug: string; label: string }[];
  areas: string[];
  basins: string[];
  provinces: string[];
  formations: string[];
  resourceTypes: string[];
  resourceSubtypes: string[];
}

function MultiSelect({
  label,
  values,
  options,
  onChange,
  placeholder,
  searchable = true,
}: {
  label: string;
  values: string[];
  options: { value: string; label: string }[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const optionsMap = useRef(new Map(options.map((o) => [o.value, o.label]))).current;

  const toggle = (value: string) => {
    const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 justify-between gap-2 min-w-[160px] max-w-[240px]"
        >
          <span className="truncate">
            {values.length === 0 ? (
              <span className="text-muted-foreground">
                {placeholder ?? `Todos los ${label.toLowerCase()}`}
              </span>
            ) : (
              <span className="flex flex-wrap gap-1">
                {values.map((v) => (
                  <Badge key={v} variant="secondary" className="font-normal">
                    {optionsMap.get(v) ?? v}
                  </Badge>
                ))}
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          {searchable && <CommandInput placeholder={`Buscar ${label.toLowerCase()}…`} />}
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup className="max-h-56 overflow-y-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => toggle(option.value)}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                    values.includes(option.value)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {values.includes(option.value) && <Check className="h-3 w-3" />}
                </div>
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
        {values.length > 0 && (
          <div className="border-t p-1.5">
            <button
              type="button"
              className="w-full rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => onChange([])}
            >
              Limpiar selección
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function PeriodSelect({
  label,
  value,
  periods,
  onValue,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  periods: string[];
  onValue: (v: string | undefined) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => onValue(v === "all" ? undefined : v)}>
        <SelectTrigger className="h-10 w-[150px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo el período</SelectItem>
          {periods.map((period) => (
            <SelectItem key={period} value={period}>
              {formatMonthLabel(period)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function formatMonthLabel(period: string): string {
  const d = new Date(`${period}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return period;
  return new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric" }).format(d);
}

export interface FilterBarProps {
  deps: FilterDeps;
  value: ExplorerFilters;
  onChange: (filters: ExplorerFilters) => void;
  controls?: ReactNode;
}

/**
 * Barra de filtros compartida: producto, rango de períodos y multiselects
 * de operador/áreas/cuencas/provincias/formaciones/tipos.
 */
export function FilterBar({ deps, value, onChange, controls }: FilterBarProps) {
  const set = (patch: Partial<ExplorerFilters>) => onChange({ ...value, ...patch });
  const productOptions = deps.products.map((p) => ({ value: p.id, label: p.label }));
  const operatorOptions = deps.operators.map((o) => ({ value: o.slug, label: o.label }));
  const toOptions = (xs: string[]): { value: string; label: string }[] =>
    xs.map((x) => ({ value: x, label: x }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={value.product}
          onValueChange={(v) => set({ product: v as ExplorerFilters["product"] })}
        >
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {productOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <PeriodSelect
          label="Desde"
          value={value.startPeriod}
          periods={deps.periods}
          onValue={(v) => set({ startPeriod: v })}
          placeholder="Inicio"
        />
        <PeriodSelect
          label="Hasta"
          value={value.endPeriod}
          periods={deps.periods}
          onValue={(v) => set({ endPeriod: v })}
          placeholder="Actual"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MultiSelect
          label="Operador"
          values={value.operators ?? []}
          options={operatorOptions}
          onChange={(next) => set({ operators: next })}
          placeholder="Todas las operadoras"
        />
        <MultiSelect
          label="Área"
          values={value.areas ?? []}
          options={toOptions(deps.areas)}
          onChange={(next) => set({ areas: next })}
        />
        <MultiSelect
          label="Cuenca"
          values={value.basins ?? []}
          options={toOptions(deps.basins)}
          onChange={(next) => set({ basins: next })}
        />
        <MultiSelect
          label="Provincia"
          values={value.provinces ?? []}
          options={toOptions(deps.provinces)}
          onChange={(next) => set({ provinces: next })}
        />
        <MultiSelect
          label="Formación"
          values={value.formations ?? []}
          options={toOptions(deps.formations)}
          onChange={(next) => set({ formations: next })}
        />
        <MultiSelect
          label="Tipo de recurso"
          values={value.resourceTypes ?? []}
          options={toOptions(deps.resourceTypes)}
          onChange={(next) => set({ resourceTypes: next })}
        />
        <MultiSelect
          label="Subtipo"
          values={value.resourceSubtypes ?? []}
          options={toOptions(deps.resourceSubtypes)}
          onChange={(next) => set({ resourceSubtypes: next })}
        />
        {controls}
      </div>
    </div>
  );
}

export function LegendChips({ items }: { items: { key: string; label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function ClearFiltersButton({ active, onClear }: { active: boolean; onClear: () => void }) {
  if (!active) return null;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground"
      onClick={onClear}
    >
      <X className="h-3.5 w-3.5" />
      Limpiar filtros
    </button>
  );
}
