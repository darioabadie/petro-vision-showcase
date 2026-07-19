# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # install deps
bun dev              # start dev server (TanStack Start)
bun build            # production build
bun typecheck        # tsc --noEmit
bun lint             # eslint
```

## Architecture

**Stack:** TanStack Start (SSR) + React + Recharts + shadcn/ui + Tailwind CSS. Bundled with Bun.

**Routing:** TanStack Router file-based. Routes live in `src/routes/`. The route tree is auto-generated in `src/routeTree.gen.ts` — never edit it manually. Each route file exports a `Route` with `createFileRoute`, a loader, and a component.

**Data flow (mock phase):** All data comes from `src/lib/petrodata.json` (real Capítulo IV + Adjunto IV data at corte 2026-05). `src/lib/mock-data.ts` imports and re-shapes that JSON into typed exports consumed by route components. No API calls yet — the production architecture replaces `petrodata.json` with a fetch to a static JSON in Azure Blob Storage (`$web` container).

**Plan gate:** `src/lib/plan-context.tsx` exposes `usePlan()` → `{ isPro }`. `<GatedModule>` in `src/components/gated-module.tsx` blurs or hides Pro content. `<PlanToggle>` lets users demo the Pro view. Demo Pro data lives in `mock-data.ts` (e.g. `proGuidanceDemo`, `ducsDemo`) and is clearly separated from official KPIs.

**Key data exports from `mock-data.ts`:**
- `kpis` — national KPIs from JSON (oil, gas, pozos conectados, arena, etapas, rama)
- `productionSeries` — last 24 months oil/gas national series
- `operators` — array of `Operator` (merged JSON + editorial metadata from `OP_META`)
- `areas` — array of `Area` (from JSON; `avgStages` / `avgProppantTn` / `avgLateralM` currently use national fallbacks — per-area Adjunto IV data is a known gap)
- `declineByCohort` / `COHORT_LABELS` — type curve data by year cohort
- `proGuidanceDemo` / `ducsDemo` — demo Pro datasets (not official data)
- `events` / `contradictions` — empty arrays; editorial layer is Phase 2

**Routes:**
- `/` — T1: Overview (production, ranking, cohort curves, DUCs teaser, guidance tracker demo)
- `/operadoras` — operator list ranked by oil production
- `/operadoras/$slug` — operator detail (series, areas, events, contradictions)
- `/areas` — area grid cards
- `/areas/$slug` — area detail (completación Adjunto IV, series, cohort curves, events)
- `/eventos` — editorial event timeline (currently empty, Phase 2)
- `/contradicciones` — guidance tracker (Pro-gated, uses `proGuidanceDemo`)
- `/wiki` — glossary
- `/newsletter` — newsletter issues
- `/metodologia` — methodology
- `/pro` — Pro waitlist

## Data notes

- `petrodata.json` has `oil_mom_pct` per operator in `operadoras[slug]` — use it instead of hardcoding deltas.
- `kpis.corte` = `"2026-05"` — use for dynamic labels (e.g. "Ranking May 2026"), never hardcode month strings.
- Arena data (`arena_tn`, `arena_mom_pct`) has a known rezago issue documented in `mock-data.ts` (`ARENA_PRELIMINAR = true`). The `<Info>` banner in the overview handles this.
- `declineByCohort` uses the national cohorte data — areas don't yet have individual type curves.
- T7 (Actividad y DUCs) is defined as the second main tablero in `docs/arquitectura-mvp.md` but does not yet have its own route.
