"""Formas y métricas del home (KPIs, contribuciones, insights).

Operan sobre filas de mart_argentina_monthly_production y del agregado
por operador, con convenciones de formato locales de Argentina.
"""

from __future__ import annotations

from typing import Any

OIL_UNIT = "m³"
GAS_UNIT = "miles de m³"
WELLS_UNIT = "pozos"


def format_magnitude(value: float) -> str:
    """Formatea con sufijo B/M/K y coma decimal: 4499514 -> '4,50 M'."""
    abs_v = abs(value)
    if abs_v >= 1_000_000_000:
        return f"{value / 1_000_000_000:.2f}".replace(".", ",") + " B"
    if abs_v >= 1_000_000:
        return f"{value / 1_000_000:.2f}".replace(".", ",") + " M"
    if abs_v >= 1_000:
        return f"{value / 1_000:.2f}".replace(".", ",") + " K"
    return f"{value:,.0f}".replace(",", ".")


def format_thousands(value: float) -> str:
    return f"{int(value):,}".replace(",", ".")


def pct_change(current: float | None, previous: float | None) -> float | None:
    if current is None or previous is None or previous == 0:
        return None
    return round((current - previous) / previous * 100, 1)


def _status(mom: float | None) -> str:
    if mom is None:
        return "neutral"
    if mom > 0:
        return "positive"
    if mom < 0:
        return "negative"
    return "neutral"


def build_kpis(series: list[dict], index: dict[str, int]) -> list[dict]:
    """Series ordenadas por periodo creciente; mide en el último completo."""
    if not series:
        return []
    last = series[-1]
    last_period = last["period"]
    idx = index[last_period]
    prev = series[idx - 1] if idx > 0 else None
    prev_yoy = series[idx - 12] if idx >= 12 else None

    def field(k: str, back: int = 0) -> float | None:
        a = series[idx - back]
        return a.get(k)

    def field_prev(k: str) -> float | None:
        return prev.get(k) if prev else None

    def field_yoy(k: str) -> float | None:
        return prev_yoy.get(k) if prev_yoy else None

    oil = float(last["oil_m3"])
    gas = float(last["gas_thousand_m3"])
    wells = int(last["productive_wells"])
    share = oil and (float(last["oil_nonconventional_m3"]) / oil * 100) or 0.0

    mom_oil = pct_change(oil, field_prev("oil_m3"))
    yoy_oil = pct_change(oil, field_yoy("oil_m3"))
    mom_gas = pct_change(gas, field_prev("gas_thousand_m3"))
    yoy_gas = pct_change(gas, field_yoy("gas_thousand_m3"))

    prev_share = (
        (prev["oil_nonconventional_m3"] / prev["oil_m3"] * 100)
        if prev and prev.get("oil_m3")
        else None
    )
    yoy_share_val = (
        (prev_yoy["oil_nonconventional_m3"] / prev_yoy["oil_m3"] * 100)
        if prev_yoy and prev_yoy.get("oil_m3")
        else None
    )
    mom_share = pct_change(share, prev_share)
    yoy_share = pct_change(share, yoy_share_val)
    mom_wells = pct_change(wells, field_prev("productive_wells"))
    yoy_wells = pct_change(wells, field_yoy("productive_wells"))

    return [
        {
            "id": "oil_production",
            "label": "Producción de petróleo",
            "value": oil,
            "display_value": format_magnitude(oil),
            "unit": OIL_UNIT,
            "change_mom_pct": mom_oil,
            "change_yoy_pct": yoy_oil,
            "status": _status(mom_oil),
            "definition_id": "oil_production",
        },
        {
            "id": "gas_production",
            "label": "Producción de gas",
            "value": gas,
            "display_value": format_magnitude(gas),
            "unit": GAS_UNIT,
            "change_mom_pct": mom_gas,
            "change_yoy_pct": yoy_gas,
            "status": _status(mom_gas),
            "definition_id": "gas_production",
        },
        {
            "id": "unconventional_share",
            "label": "Participación no convencional",
            "value": round(share, 1),
            "display_value": f"{share:.1f}".replace(".", ",") + " %",
            "unit": "%",
            "change_mom_pct": mom_share,
            "change_yoy_pct": yoy_share,
            "status": _status(mom_share),
            "definition_id": "unconventional_share",
        },
        {
            "id": "productive_wells",
            "label": "Pozos con producción positiva",
            "value": wells,
            "display_value": format_thousands(wells),
            "unit": WELLS_UNIT,
            "change_mom_pct": mom_wells,
            "change_yoy_pct": yoy_wells,
            "status": _status(mom_wells),
            "definition_id": "productive_well",
        },
    ]


def build_contributions(operator_series: list[dict], last_period: str) -> list[dict]:
    """Aportes al cambio mensual de petróleo (delta positivo) por operador."""
    by_period: dict[str, dict[str, float]] = {}
    names: dict[str, str] = {}
    periods: list[str] = []
    for row in operator_series:
        p = row["period"]
        if p not in by_period:
            by_period[p] = {}
            periods.append(p)
        by_period[p][row["operator_slug"]] = float(row["oil_m3"])
        names[row["operator_slug"]] = row["operator_name"]
    if len(periods) < 2 or last_period not in by_period:
        return []
    prev_period = periods[periods.index(last_period) - 1]
    deltas: list[tuple[str, float]] = []
    for slug, cur in by_period[last_period].items():
        prev = by_period[prev_period].get(slug, 0)
        delta = cur - prev
        if delta > 0:
            deltas.append((slug, delta))
    deltas.sort(key=lambda x: x[1], reverse=True)
    total = sum(d for _, d in deltas)
    if total <= 0:
        return []
    result: list[dict] = []
    for slug, delta in deltas[:5]:
        result.append(
            {
                "operator_slug": slug,
                "operator_name": names.get(slug, slug),
                "delta_oil_m3": round(delta),
                "share_of_change_pct": round(delta / total * 100, 1),
            }
        )
    rest = sum(d for _, d in deltas[5:])
    if rest > 0:
        result.append(
            {
                "operator_slug": "other",
                "operator_name": "Otros",
                "delta_oil_m3": round(rest),
                "share_of_change_pct": round(rest / total * 100, 1),
            }
        )
    return result


def build_insights(
    series: list[dict],
    contributions: list[dict],
    last_complete_period: str,
    data_cutoff: str,
    is_warning: bool,
) -> list[dict]:
    insights: list[dict] = []
    last = series[-1] if series else {}
    oil = float(last.get("oil_m3") or 0)
    nonconv = float(last.get("oil_nonconventional_m3") or 0)
    share = (nonconv / oil * 100) if oil else 0
    insights.append(
        {
            "id": "insight-1",
            "title": "El no convencional explica el crecimiento",
            "body": (
                f"El no convencional ya representa {share:.1f}%".replace('.', ',')
                + " de la producción de petróleo del último período completo."
            ),
            "tone": "positive" if share >= 50 else "neutral",
        }
    )
    if contributions:
        lead = contributions[0]
        insights.append(
            {
                "id": "insight-2",
                "title": f"{lead['operator_name']} lidera el aporte del mes",
                "body": (
                    f"{lead['operator_name']} explica {str(lead['share_of_change_pct']).replace('.', ',')} %"
                    " del aumento mensual de petróleo."
                ),
                "tone": "neutral",
            }
        )
    insights.append(
        {
            "id": "insight-3",
            "title": f"Datos completos hasta {last_complete_period[:7]}",
            "body": (
                f"El corte de datos es {data_cutoff}; el último período completo es {last_complete_period[:7]}."
                + (" Esta release es provisoria (ver /calidad)." if is_warning else "")
            ),
            "tone": "information",
        }
    )
    return insights


def pick_mode(rows: list[tuple[str, float]]) -> str:
    """Devuelve el valor con mayor peso (para dimensiones de explorer)."""
    if not rows:
        return ""
    return max(rows, key=lambda x: x[1])[0]


def round_ints(payload: Any) -> Any:
    if isinstance(payload, float):
        return round(payload)
    if isinstance(payload, dict):
        return {k: round_ints(v) for k, v in payload.items()}
    if isinstance(payload, list):
        return [round_ints(v) for v in payload]
    return payload