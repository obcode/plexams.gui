---
name: refactor-roadmap
description: Laufender Architektur-Refactor — was erledigt ist und welche Blöcke offen sind
metadata:
  node_type: memory
  type: project
  originSessionId: c5f57170-c127-4286-8376-33501b96ade2
---

Großer Architektur-Refactor der über Jahre gewachsenen, kaum refactorten Codebasis. Gestartet ~2026-07-03, Baseline-Tag `pre-refactor`. Nutzer (Oliver) will **maximal aktuell** bleiben und hohe Testabdeckung.

**Konventionen für diesen Refactor:**

- Semilineare Historie (Fast-Forward-Merges, keine Merge-Commits). Atomare Commits.
- Struktureller/mehrsessioniger Umbau in einem Branch; risikoarme Cleanups/Infra direkt auf `main`.
- Muster: pure Logik aus `.svelte` in getestete `lib/**/*.ts`-Module ziehen, dann zurück-importieren. Jede Änderung: `npm test` + `npm run check` (Baseline 137/8 nicht erhöhen) + `npm run build` grün.
- Commit-Footer `Co-Authored-By: Claude Opus 4.8`.

**ERLEDIGT (auf main):**

- Tote Seiten/Endpunkte/Komponenten + Houdini-Gerüst + fullcalendar-Deps entfernt (check 244→137)
- Vitest-Infra (`npm test`/`test:watch`/`test:coverage`/`test:e2e`); 40 Unit-Tests
- `lib/server/gqlProxy` — 67 `/api`-Proxies dedupliziert (−469 Zeilen)
- Pure Logik extrahiert+getestet: `lib/date/calendar`, `lib/exam/{fk,conflictDiff,conflictLoop,examFilter,otherFkGroups}`
- **codegen repariert** (Schema war korrupt: Student.regsWithProgram doppelt) — läuft offline gegen `schema.graphql`; `lib/gql/{fragments.js,types.ts,__generated__}`

**OFFENE BLÖCKE (Reihenfolge grob):**

1. **Phase-0-Infra:** CI-Qualitäts-Gate (check/test/build) + Dependabot — [[stay-current-strategy]]
2. **Datenschicht auf TS + generierte Typen:** `/api/**`, `+page.server` → `.ts`, `lib/gql/types` nutzen. check-Fehler Richtung 0, dann Baseline scharf (CI blocking).
3. **Svelte Runes-Migration** (kombiniert mit TS, eine Datei = einmal anfassen) — [[svelte-runes-migration]]. Endschalter `compilerOptions.runes: true` zuletzt.
4. **17 übersprungene `/api`-Proxies** mit Sonder-Fehlerbehandlung angleichen (gqlProxy erweitern).
5. **e2e-Smoke-Tests** (Playwright gegen gemockten GraphQL-Endpunkt) für Kern-Workflows.
6. GraphQL-Fragmente nur wo Feld-Sets **exakt** identisch sind (constraints/zpaExam sind bewusst divergente Subsets — kein Zwangs-Dedup).
