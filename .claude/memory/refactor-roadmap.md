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

**BULK-RUNES via `sv migrate` (2026-07-03, Commit 9bcc93e):** Nutzer hat `npx sv migrate svelte-5` LOKAL laufen lassen (meine Umgebung kann den interaktiven TTY-Prompt nicht bedienen — hängt). 67 Dateien auf Runes konvertiert, gepusht. Build + 40 Tests grün, CI-Gate grün (check ist `continue-on-error`). ABER: check stieg 105→134 (Aufräum-Schulden), und die Migration crashte auf `/plan/exams/+page.svelte` (MagicString-Fehler → blieb weitgehend legacy, aber 34→29 Fehler).

**OFFENE BLÖCKE:**

**✅ POST-MIGRATE-CLEANUP ABGESCHLOSSEN (2026-07-03):** `svelte-check` **0 Fehler** (244→0 über die Session!), nur noch 8 Warnungen (a11y + state_referenced_locally). **CI-Gate scharf** (quality.yml: check ohne continue-on-error → blockierend). `/plan/exams` (der sv-migrate-Crash-Kandidat) war doch runes-migriert, nur untypisiert — Fix: Array/Map-`$state`-Casts, Param-JSDoc, `slotsStatus[[a,b]]` → `` [`${a},${b}`] `` (Array-Key → String-Key). Build + 40 Tests grün, alles gepusht.

**✅ ENDSCHALTER `compilerOptions.runes: true` ERREICHT (2026-07-04, auf main gepusht):** Die komplette Event-Migration ist durch — **0 `on:`-Direktiven, 0 `createEventDispatcher`, 0 `export let`, 0 `$:`, 0 `<slot>`** im eigenen Code. Manuell in koordinierten, atomaren Batches (Kind→Callback-Prop + Eltern `on:X`→`onX`), je Batch check+build+test grün + gepusht; Cluster SlotExam→Slot→ExamsWithoutSlot→/plan/exams-Grid zuletzt. Dispatcher→Callback-Props: WriteButton (on:click global → onclick, 66×), RoomRequestToggles, ConstraintsModal, AttachmentManager, SubscriptionTerminal/StreamAction (done), ValidatorCard/ValidationGroup (ValidationGroup war der `state`-Namenskollisions-Blocker → `runs`), Slot-Cluster (selected/unselected). **Tote addToSlot/rmFromSlot-Kette komplett entfernt** (SlotExam-dispatch war auskommentiert, Grid-Handler leere No-ops, Backend-Mutation `addExamToSlot` ungenutzt). Startseite + ValidationGroup + connected auf Runes.
  - **`runes: true` bricht Legacy-Source-Libs:** `@svelte-plugins/tooltips` nutzt `export let` → Build-Fehler, weil der globale Zwang auch node_modules trifft. Fix: `vitePlugin.dynamicCompileOptions` in svelte.config.js lässt `node_modules` im Legacy-Modus (`{ runes: false }`).
  - **`run()` aus `svelte/legacy`:** überwiegend → `$effect` (async/Seiteneffekt) bzw. writable `$derived` (connected). **3 bewusst als `run()` belassen** (korrekt + SSR-sicher): ExamConflictsPanel/examsToPlan (tiefe In-place-Mutation der zurückgesetzten Liste) + SemesterConfigForm (`bind:` aufs aus config abgeleitete Formular) — `run()` läuft anders als `$effect` auch bei SSR; naive $effect-Umstellung würde dort SSR-Inhalt leeren.

**OFFEN — kleiner Rest:**
- 8 Warnungen (a11y `<span>`/`<h3>`-Klick-Handler in ExamGroupCard; `state_referenced_locally` in InvigilatorTR/invigilation; `<tr>`-in-`<table>` in SlotsMiniMap) — optional.
- 3 verbliebene `run()`-Blöcke (s. o.) — nur bei Bedarf sauber via writable-$derived+Reassign auflösen.
- e2e-Smoke-Tests (Playwright/mocked); 17 Sonder-Proxies an gqlProxy; GraphQL-Fragmente nur bei identischen Sets.

<!-- Historie des Cleanups (erledigt): --> check 134→**96** (unter Pre-Migration 105!). Erledigt: examersToPlan, InvigilatorTR, ExamsWithoutSlot, SlotExam, kdprooms (run()→$derived), ExamWithNTAsForRoomPlanning+StreamAction (Typedef-Fix). Drei Muster: (a) `run(() => { x = expr })` aus `svelte/legacy` → `const x = $derived[.by](...)`; (b) implizite `any` typisieren — ACHTUNG `lang="ts"`-Components → `: any`, reine `<script>`-Components → JSDoc, NIE mischen!; (c) **HÄUFIG & billig:** sv migrate hängte `@type {...}` an `@property`-Zeilen → kaputte Props-Typedef (alle Props „existieren nicht"); suche `grep -rn "@property.*@type"`, entferne den `@type`-Suffix. Noch ~10 `run()`-Dateien + Dispatcher-Reste. Ziel check→0. Größter Rest-Brocken: `/plan/exams/+page.svelte` (29, NICHT migriert — sv-migrate-Crash; `slotsStatus[[day,time]]`-Array-Index), misc.js (8, .js-lib), validation/store.js (5).
2. **Event-Migration-Rezept** (falls noch nötig): Kind `dispatch('x',v)` → Callback-Prop `onx?.(v)`; native `on:click`→`onclick`; Eltern `on:x={h}`→`onx={h}`, Handler nimmt Wert direkt. `WriteButton` (Legacy) nimmt `onclick={fn}` via `$$restProps` — verifiziert. Endschalter `compilerOptions.runes: true` ganz zuletzt.
3. **Loads → TS inkrementell:** `+page.server.js` (~36 übrig) NICHT bulk (JSDoc-`@type` wirkt in `.js`, wird in `.ts` IGNORIERT → +155 Fehler beim Bulk-Versuch, revertiert). Pro Datei JSDoc→TS umschreiben, am besten zusammen mit der Runes-Migration der Seite. Muster: `plan/external`.
4. **Runes-Migration fortsetzen:** Blätter → Container → Seiten. Events (`on:`/`createEventDispatcher`, 63/18 Dateien) = Callback-Props, Kind+Eltern koordiniert. Endschalter `compilerOptions.runes: true` ganz zuletzt. — [[svelte-runes-migration]]
5. **check → 0**, dann `continue-on-error` in quality.yml entfernen (Typ-Baseline scharf).
6. **17 übersprungene `/api`-Proxies** (Sonder-Fehlerbehandlung) an gqlProxy angleichen.
7. **e2e-Smoke-Tests** (Playwright gegen gemockten GraphQL-Endpunkt).
8. GraphQL-Fragmente nur wo Feld-Sets **exakt** identisch (constraints/zpaExam sind bewusst divergent).
