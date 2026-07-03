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

**ERLEDIGT (auf main, gepusht — jeder Merge cuttet via semantic-release ein Release):**

- Tote Seiten/Endpunkte/Komponenten + Houdini-Gerüst + fullcalendar-Deps entfernt (check 244→137)
- Vitest-Infra (`npm test`/`test:watch`/`test:coverage`/`test:e2e`); **40 Unit-Tests**
- `lib/server/gqlProxy` — Proxy-Boilerplate dedupliziert
- Pure Logik extrahiert+getestet: `lib/date/calendar`, `lib/exam/{fk,conflictDiff,conflictLoop,examFilter,otherFkGroups}`
- **codegen repariert** (Schema war korrupt) — läuft offline gegen `schema.graphql`; `lib/gql/{fragments.js,types.ts,__generated__}`
- **Phase-0-Infra:** `.github/workflows/quality.yml` (test+build hart, check informativ via continue-on-error) + `.github/dependabot.yml`
- **Gesamte `/api`-Schicht → TypeScript** (104 Handler, `RequestHandler`-Typ; `request<any>` wo nötig). Referenz-Load `plan/external/+page.server.ts` (echtes QueryResult + exportierter `OtherFkItem`).
- **Runes-Migration gestartet:** 6 Blatt-Komponenten auf Runes+TS (`slot/{RoomNamesInSlot,SlotsMiniMap}`, `config/NoSemesterConfig`, `invigilator/InvigilationDayPlanning`, `room/RoomRequestPlanned`, `email/EmailCard`). Stand check: **134/8**.

**OFFENE BLÖCKE:**

1. **Loads → TS inkrementell:** `+page.server.js` (~36 übrig) NICHT bulk (JSDoc-`@type` wirkt in `.js`, wird in `.ts` IGNORIERT → +155 Fehler beim Bulk-Versuch, revertiert). Pro Datei JSDoc→TS umschreiben, am besten zusammen mit der Runes-Migration der Seite. Muster: `plan/external`.
2. **Runes-Migration fortsetzen:** Blätter → Container → Seiten. Events (`on:`/`createEventDispatcher`, 63/18 Dateien) = Callback-Props, Kind+Eltern koordiniert. Endschalter `compilerOptions.runes: true` ganz zuletzt. — [[svelte-runes-migration]]
3. **check → 0**, dann `continue-on-error` in quality.yml entfernen (Typ-Baseline scharf).
4. **17 übersprungene `/api`-Proxies** (Sonder-Fehlerbehandlung) an gqlProxy angleichen.
5. **e2e-Smoke-Tests** (Playwright gegen gemockten GraphQL-Endpunkt).
6. GraphQL-Fragmente nur wo Feld-Sets **exakt** identisch (constraints/zpaExam sind bewusst divergent).
