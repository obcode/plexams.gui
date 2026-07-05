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
  - **`run()` aus `svelte/legacy`:** überwiegend → `$effect` (async/Seiteneffekt) bzw. writable `$derived` (connected). **✅ ALLE `run()` weg (2026-07-04, auf main):** 0 `svelte/legacy`-Imports mehr. Die letzten 3:
    - **ExamConflictsPanel + examsToPlan** → writable `$derived` (`working` / `items`), Updates per **Reassignment** statt In-place: `patch`/`patchItem` machen `x = x.map(...)` mit Kopie des betroffenen Eintrags; examsToPlan-sameSlot-Partner über `items.map` mit `withSameSlotPartner`/`withoutSameSlotPartner` (byAncode bleibt `$derived`, filterStatus einmalig aus Load-Daten init + `svelte-ignore state_referenced_locally`). Reset bei jedem invalidateAll gratis über die Ableitung.
    - **SemesterConfigForm** → **NICHT** writable `$derived` (das `form` ist tief mit `bind:` verdrahtet + nested Reassign + Set im Template → Proxy-Reaktivität nötig, die `$derived` nicht bietet). Stattdessen: `form` bleibt `$state(initForm(config))`, der **Reset wandert in den Aufrufer** `/config` als `{#key data.config}` (Remount nach dem Speichern, wenn invalidateAll die neu berechnete Config lädt). `$effect`-Reset wäre vom ESLint `svelte/prefer-writable-derived` geblockt.
    - **SSR-Verifikation:** live `corepack pnpm dev` + `curl` (roher SSR): `/config` rendert Formular voll (5 Slot-Inputs, 50 MUC.DAI-Checkboxen, E-Mail/Datum-Werte) → `$state`-Init füllt SSR ohne run(). Zusätzlich isolierte `svelte/server`-`render()`-Wegwerftests (mit `$app/stores`-Mock) bestätigt: `items`/`working`-$derived + counts/byAncode/filterStatus-Init erzeugen den Inhalt schon bei SSR, Leerzustand crasht nicht. **Achtung:** Test-Backend `Test26SS` lehnt `zpaExamsToPlanWithConstraints` + `examScheduleConflicts` mit GraphQL 400 ab (Schema-Mismatch) → examsToPlan/generate ließen sich NICHT mit echten Backend-Daten klicken; Panel zeigt dann sauber seinen loadError-Zweig.

**✅ svelte-check 0 Fehler / 0 WARNUNGEN (2026-07-04):** Alle 8 Rest-Warnungen behoben — Reaktivitäts-Bugs (InvigilatorTR-Counts + invigilation-Maps → `$derived.by`, stillOpen → reduce), a11y (ExamGroupCard `<h3>`/`<span>` → `<button>`), SSR (`<tbody>` in SlotsMiniMap); zwei bewusste Init-aus-State-Fälle mit `svelte-ignore state_referenced_locally`.

**✅ LOADS → TS KOMPLETT (2026-07-04, auf main, 5 Commits):** Die gesamte Route-Load-Schicht ist jetzt TypeScript — **0 `+page.server.js`, 0 `+layout.server.js`, 0 route-`+page.js` mehr**. 37 `+page.server.js` + `+layout.server.js` + 3 Redirect-`+page.js` konvertiert, in 5 atomaren Batches (Blatt-Loads → NTA/email/zpa → plan/ → plan-exams/exam/config/root → Layout+Redirects), je Batch check 0/0 + build + 40 Tests grün + committet. Muster: `export async function load()` → `export const load: PageServerLoad = async () => {}`, JSDoc-`@type`/`@param` → TS-Inline-Typen, `request<any>` bzw. kleine getypte QueryResults, JSDoc-typisierte Maps/Records/Sets → TS-Generics. Zwei Typ-Verengungen nötig (plan/rooms `unplacedAncodes` als `Set<number>`, kdprooms `plannedRooms: any[]` + `.get() ?? []`); primuss/mucdai `mucdaiExams` als `any[]` (Seite iteriert dynamisch). Damit ist Block 3 (Loads → TS) der Roadmap **abgeschlossen**.

**✅ E2E-SMOKE-SUITE (2026-07-04, auf main, Commit af7f517):** Chromium ist jetzt IM DevContainer (`/ms-playwright`, `PLAYWRIGHT_BROWSERS_PATH` gesetzt) — die alte Blockade ist weg. Playwright-Smoke-Suite ersetzt den Scaffold-Test: `tests/smoke.test.js` besucht alle **39 param-freien Routen** + Startseiten-Check, assertet HTTP < 400 (kein 500 aus geworfenem load()) + Layout-`<nav>` attached. Läuft gegen das **echte Test-Backend Test26SS** (voll bestückt, schema-kompatibel — die früher 400-enden Queries liefern jetzt Daten), KEIN GraphQL-Mock. **Nicht im CI-Gate** (quality.yml hat kein Backend). 40/40 grün in ~9 s (nach Build). Fallstricke/Lösungen:
  - `@playwright/test` **exakt zur Browser-Revision pinnen**: chromium-**1228** ↔ **@playwright/test@1.61.1** (Mapping via `unpkg.com/playwright-core@<v>/browsers.json`).
  - webServer-Command **`npm run build && npm run preview`** (nicht pnpm): der Subprozess erbt sonst den corepack-pnpm-Versionscheck (11.9 vs 11.10) und stirbt.
  - **`/dev/shm` nur 64 MB** → Chromium „Page crashed" unter Parallel-Last. Fix: `launchOptions.args: ['--disable-dev-shm-usage']` + `workers: 2` + `retries: 1`.
  - **`goto` mit `waitUntil: 'commit'`** statt `'domcontentloaded'`: `/validate` startet beim Mount Dauer-Validierungs-Streams → domcontentloaded/load settlen nie, goto hängt bis Timeout. `commit` wartet nur auf die SSR-Antwort; `<nav>` ist im SSR-HTML sowieso da.
  - **vitest von Playwright trennen:** `vite.config.js` → `test.include: ['src/**/*.{test,spec}.{js,ts}']` (via `defineConfig` aus `vitest/config`; vitest 4 exportiert kein `UserConfig`-Typ mehr), sonst sammelt `pnpm test` die Playwright-Specs ein.
  - `test-results/` + `playwright-report/` in `.gitignore`.

**OFFEN — kleiner Rest:**
- ✅ Loads → TS: komplett.
- ✅ `run()`-Blöcke: alle 3 erledigt — 0 `svelte/legacy` mehr.
- ✅ e2e-Smoke-Suite: 39 param-freie Routen + 3 param-Routen (siehe oben).
- ✅ **e2e param-Routen** (2026-07-05, Commit b0a833a): `tests/params.test.js` — `/exam/assembledExams/[ancode]`, `/nta/[mtknr]`, `/plan/invigilation/[day]`. IDs zur Laufzeit aus `plannedExams`/`ntasWithRegs`/`semesterConfig` im `beforeAll` (nicht hartkodiert). 43 Playwright-Tests grün. **Fund dabei:** die 4. param-Route `/exam/examGroups/[code]` war TOT — GraphQL-Feld `examGroup` existiert nicht mehr im Schema. Auf Wunsch komplett entfernt (Commit 615f2c9): Route + `lib/examGroups/{ExamGroupCard,ExamGroupConflictCard}` + toter Link in ExamWithNTAsCard + auskommentierte `calculateConflicts`/„N Konflikte"-Badge in Slot.svelte. `nta(mtknr)` liefert in Test26SS für alle mtknrs `null` → die Seite rendert sauber ihren Leerzweig (Test prüft nur SSR-Render, nicht den befüllten Pfad).
- **17 Sonder-Proxies** an gqlProxy angleichen; **GraphQL-Fragmente** nur bei exakt identischen Feld-Sets. ← nächster Block

<!-- Historie des Cleanups (erledigt): --> check 134→**96** (unter Pre-Migration 105!). Erledigt: examersToPlan, InvigilatorTR, ExamsWithoutSlot, SlotExam, kdprooms (run()→$derived), ExamWithNTAsForRoomPlanning+StreamAction (Typedef-Fix). Drei Muster: (a) `run(() => { x = expr })` aus `svelte/legacy` → `const x = $derived[.by](...)`; (b) implizite `any` typisieren — ACHTUNG `lang="ts"`-Components → `: any`, reine `<script>`-Components → JSDoc, NIE mischen!; (c) **HÄUFIG & billig:** sv migrate hängte `@type {...}` an `@property`-Zeilen → kaputte Props-Typedef (alle Props „existieren nicht"); suche `grep -rn "@property.*@type"`, entferne den `@type`-Suffix. Noch ~10 `run()`-Dateien + Dispatcher-Reste. Ziel check→0. Größter Rest-Brocken: `/plan/exams/+page.svelte` (29, NICHT migriert — sv-migrate-Crash; `slotsStatus[[day,time]]`-Array-Index), misc.js (8, .js-lib), validation/store.js (5).
2. **Event-Migration-Rezept** (falls noch nötig): Kind `dispatch('x',v)` → Callback-Prop `onx?.(v)`; native `on:click`→`onclick`; Eltern `on:x={h}`→`onx={h}`, Handler nimmt Wert direkt. `WriteButton` (Legacy) nimmt `onclick={fn}` via `$$restProps` — verifiziert. Endschalter `compilerOptions.runes: true` ganz zuletzt.
3. **Loads → TS inkrementell:** `+page.server.js` (~36 übrig) NICHT bulk (JSDoc-`@type` wirkt in `.js`, wird in `.ts` IGNORIERT → +155 Fehler beim Bulk-Versuch, revertiert). Pro Datei JSDoc→TS umschreiben, am besten zusammen mit der Runes-Migration der Seite. Muster: `plan/external`.
4. **Runes-Migration fortsetzen:** Blätter → Container → Seiten. Events (`on:`/`createEventDispatcher`, 63/18 Dateien) = Callback-Props, Kind+Eltern koordiniert. Endschalter `compilerOptions.runes: true` ganz zuletzt. — [[svelte-runes-migration]]
5. **check → 0**, dann `continue-on-error` in quality.yml entfernen (Typ-Baseline scharf).
6. **17 übersprungene `/api`-Proxies** (Sonder-Fehlerbehandlung) an gqlProxy angleichen.
7. **e2e-Smoke-Tests** (Playwright gegen gemockten GraphQL-Endpunkt).
8. GraphQL-Fragmente nur wo Feld-Sets **exakt** identisch (constraints/zpaExam sind bewusst divergent).
