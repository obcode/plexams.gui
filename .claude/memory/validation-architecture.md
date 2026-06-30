---
name: validation-architecture
description: 'How the validation UI (subscriptions, groups, nav indicator) is structured'
metadata:
  node_type: memory
  type: project
  originSessionId: 64695025-3401-4f38-9ba3-5dbc6da2c4b9
---

Validation UI lives in `src/lib/validation/`: `validators.js` (per-validator defs + `validationGroups` registry), `wsClient.js` (shared lazy graphql-ws client + ansi-to-html converter), `ValidationGroup.svelte` (runs a group's subscriptions, terminal + report cards, optional `collapsible`/`storeId`), `ValidatorCard.svelte`, `store.js` (shared per-group status, localStorage-persisted, `validationSummary` derived for the Nav ampel, headless `runValidationCheck`).

Pages: `/plan/invigilation/validate`, `/plan/rooms/validate` (single group each), `/validate` (all groups, collapsed). Each backend validator is its own GraphQL subscription streaming ANSI LogLines, ending on a RESULT line carrying a structured `ValidationReport` in `LogLine.validation`. Generation lives at `/plan/invigilation/generate` (subscription `generateInvigilations`, terminal + `InvigilationReport`).

To add a validator group to the GENERAL ampel: add defs + a `validationGroups` entry in `validators.js`; `/validate` and the general Nav ampel pick it up automatically. Mind the [[validation-write-lock]]. Groups so far: `scheduling` (Terminplanung, page `/plan/exams/validate`), `rooms` (`/plan/rooms/validate`), `invigilation` (`/plan/invigilation/validate`).

Parameterized validators: a ValidatorDef may carry `argSpec: [{name,type,value}]` (e.g. `validateConflicts` with `onlyPlannedByMe: Boolean!` + `ancode: Int!`, defaults true/0). ValidationGroup builds the subscription args from argSpec; `argOverrides` prop ({key:{name:value}}) overrides defaults, and `runByKey(key, callVars)` reruns one validator with explicit values. The `/plan/exams/validate` page has a `onlyPlannedByMe` toggle + an ancode dropdown ("<ancode>. <module> (<mainexamer>)" from the `plannedExams` query) that call `runByKey('validateConflicts', ...)` on change. store.js `runGroupCheck` also honors argSpec defaults for the headless nav check.

ZPA has a SEPARATE ampel: `zpaValidators`/`zpaGroup` in `validators.js` are deliberately NOT in `validationGroups`, so they never affect `/validate` or the general ampel. The Nav shows a second "ZPA" pill driven by `zpaSummary` (derived) + `runZpaCheck` (store.js). Page `/zpa/publish` ("ZPA — Veröffentlichung") hosts 4 download + 4 upload placeholders (backend not ready yet — disabled buttons with "bald verfügbar"; wire by setting `ready:true` + a handler) plus the ZPA validations via `<ValidationGroup autostart={false} storeId="zpa">`. ValidationGroup only mirrors to the store after its first run (`started` guard), so mounting a non-autostart group doesn't wipe the persisted result.
