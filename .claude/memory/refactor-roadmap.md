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
- **Runes-Migration:** 12 event-freie Blatt-Komponenten auf Runes+TS (slot/{RoomNamesInSlot,SlotsMiniMap}, config/NoSemesterConfig, invigilator/{InvigilationDayPlanning,Room,InvigilationSlotPlanning}, room/RoomRequestPlanned, email/EmailCard, examGroups/ExamGroupConflictCard, slot/ExamsForRoomPlanning, exam/ExamWithNTAsCard, zpa/SyncLog). `$:` → `$derived[.by]`, State → `$state`. Stand check: **124/8**. Nur noch 2 große event-freie Blätter (invigilator/InvigilatorTR 247z, InvigilatorDays 328z).

**OFFENE BLÖCKE:**

1. **Event-Migration GESTARTET (der harte Kern):** Muster etabliert an `exam/ExternalExamRow`(+`/plan/external`) und `nta/NtaTR`(+`/nta/all`). Rezept: Kind `createEventDispatcher`+`dispatch('x',v)` → Callback-Prop `onx?.(v)`; native `on:click/on:change` → `onclick/onchange`; Elternteil `on:x={h}` → `onx={h}`, Handler nimmt Wert direkt (kein `e.detail`). **`WriteButton` (bleibt Legacy) nimmt `onclick={fn}` via `$$restProps`-Spread — funktioniert, verifiziert.** Noch ~61 Dispatcher/on:-Dateien; einfachste zuerst (wenige Eltern). Endschalter `compilerOptions.runes: true` ganz zuletzt.
2. **Loads → TS inkrementell:** `+page.server.js` (~36 übrig) NICHT bulk (JSDoc-`@type` wirkt in `.js`, wird in `.ts` IGNORIERT → +155 Fehler beim Bulk-Versuch, revertiert). Pro Datei JSDoc→TS umschreiben, am besten zusammen mit der Runes-Migration der Seite. Muster: `plan/external`.
3. **Runes-Migration fortsetzen:** Blätter → Container → Seiten. Events (`on:`/`createEventDispatcher`, 63/18 Dateien) = Callback-Props, Kind+Eltern koordiniert. Endschalter `compilerOptions.runes: true` ganz zuletzt. — [[svelte-runes-migration]]
4. **check → 0**, dann `continue-on-error` in quality.yml entfernen (Typ-Baseline scharf).
5. **17 übersprungene `/api`-Proxies** (Sonder-Fehlerbehandlung) an gqlProxy angleichen.
6. **e2e-Smoke-Tests** (Playwright gegen gemockten GraphQL-Endpunkt).
7. GraphQL-Fragmente nur wo Feld-Sets **exakt** identisch (constraints/zpaExam sind bewusst divergent).
