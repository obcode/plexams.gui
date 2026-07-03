---
name: svelte-runes-migration
description: Plan für die Migration von Legacy-Svelte-Syntax auf Runes (innerhalb Svelte 5)
metadata:
  node_type: memory
  type: project
  originSessionId: c5f57170-c127-4286-8376-33501b96ade2
---

Projekt ist auf **Svelte 5** (aktuell), nutzt aber **0 Runes** — durchgehend Legacy-Syntax. „Switch auf aktuelles Svelte" = Syntax-Migration Legacy→Runes, **kein** Versionssprung.

**Umfang (Stand 2026-07):** 81 Dateien `export let`, 60× `$:`, 63× `on:`, 18× `createEventDispatcher`, 4× `<slot>`.

**Schlüssel:** Svelte 5 lässt Legacy + Runes **pro Komponente** koexistieren. `svelte.config.js` hat `compilerOptions.runes: true` auskommentiert — das ist der **Endschalter**, erst ganz zuletzt aktivieren (macht verbliebene Legacy-Stellen zu Compile-Fehlern).

**Mapping:** `export let` → `$props()`; `$: x=…` → `$derived`; `$: sideEffect` → `$effect`; `createEventDispatcher`+`on:ev` → Callback-Props (`onev={…}`, Kind+Eltern zusammen!); `<slot>` → `{@render children()}`. `$store`-Auto-Subscribe bleibt.

**Strategie: Runes ZUSAMMEN mit TS migrieren** — dieselben Dateien, einmal anfassen. Runes macht Props typsicher:
`let { exam, selected = false }: { exam: ZpaExam; selected?: boolean } = $props()`.

**Phasen:** (0) CI-Gate+Dependabot → (1) 2–3 Blatt-Komponenten manuell als Referenz → (2) area-weise mit `npx sv migrate svelte-5`, Diff-Review, Events paarweise, Blätter→Container→Seiten → (3) Endschalter `runes: true`.

Riskanteste Änderung: Events (`on:` → Callback-Props) ändern die Komponenten-API → Kind und alle Eltern koordiniert umstellen. Teil von [[refactor-roadmap]].
