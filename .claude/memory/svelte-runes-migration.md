---
name: svelte-runes-migration
description: ABGESCHLOSSEN — Projekt läuft im Runes-Modus; Legacy-Syntax ist ein Compile-Fehler. Mapping-Tabelle als Referenz.
metadata:
  node_type: memory
  type: project
  originSessionId: c5f57170-c127-4286-8376-33501b96ade2
---

**Status: DONE.** Die Migration Legacy-Syntax → Runes (innerhalb Svelte 5, kein Versionssprung)
ist abgeschlossen. `svelte.config.js` setzt `compilerOptions.runes: true` global — der
„Endschalter" ist **an**, damit ist Legacy-Syntax (`export let`, `$:`, `on:`,
`createEventDispatcher`, `<slot>`) im Projekt ein **Compile-Fehler**, keine Stilfrage.
`src/` enthält keine Legacy-Konstrukte mehr.

Ausnahme: Fremd-Bibliotheken, die ihre `.svelte`-Quellen ausliefern (z. B.
`@svelte-plugins/tooltips`), werden über `dynamicCompileOptions` bewusst im Legacy-Modus
kompiliert. Diese Escape-Hatch gilt ausschließlich für `node_modules`, nie für `src/`.

**Mapping (Referenz beim Lesen alter Beispiele oder von Bibliotheks-Code):**

| Legacy | Runes |
| --- | --- |
| `export let x` | `let { x } = $props()` |
| `$: y = …` | `const y = $derived(…)` / `$derived.by(() => …)` |
| `$: sideEffect` | `$effect(() => …)` |
| `createEventDispatcher` + `on:ev` | Callback-Prop (`onev={…}`) |
| `<slot>` | `{@render children()}` |
| `$store` | unverändert — Auto-Subscribe bleibt gültig |

Runes machen Props typsicher, das war der Hebel für die gemeinsame Migration mit TypeScript:
`let { exam, selected = false }: { exam: ZpaExam; selected?: boolean } = $props()`.

Die riskanteste Klasse von Änderungen waren die Events: `on:` → Callback-Props ändert die
Komponenten-API, Kind und alle Eltern mussten koordiniert umgestellt werden. Teil von
[[refactor-roadmap]].
