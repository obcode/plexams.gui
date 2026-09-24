---
name: todos
description: "GUI side of the todos (2026-09-24): /todos, /todos/[id], landing-page box + per-phase counts, <LinkedTodos> box, Markdown rendered client-side via marked+DOMPurify, /api/todo/* exempt from the read-only guard by prefix"
metadata:
  type: project
---

Backend side: `go/todos.md`. Decided with Oliver 2026-09-24.

**Where todos show up**
- Landing page (`src/routes/+page.svelte`): "Offene Todos" box above the phase grid
  (overdue first, max 8) and per phase card an "n Todos" badge (todos linked to the
  phase OR one of its conditions, counted client-side by `openTodosPerPhase`) plus
  "+ Todo" with the phase preset.
- `/todos`: filters live in the URL (`status`, `label`, `priority`, `kind`,
  `link=KIND:key`), so a filtered view is linkable. Carry-over button when the
  previous semester (`previousSemester`) still has open/recurring todos.
- `/todos/[id]`: description, links (add/remove inline), comment thread.
- `<LinkedTodos kind key label>` (`src/lib/todo/`) loads itself; so far only on
  `exam/assembledExams/[ancode]`. Other pages = one line each once they exist
  (teachers and rooms have no detail pages yet).
- Nav: pill with the open count (hidden below `sm` -- the header already overflowed
  375px by ~35px before), plus a menu entry under Daten → Semesterdaten → Weitere.

**Markdown** (`src/lib/markdown.js`, `src/lib/Markdown.svelte`): marked + DOMPurify.
DOMPurify needs a DOM, so the component renders in `$effect` (after hydration) and
shows escaped raw text in SSR -- never `{@html}` unsanitised. Do not turn it into
`$derived` (lint suggests it): that would render HTML during hydration while SSR
rendered text. The sanitizer test runs under **jsdom**; under happy-dom DOMPurify
silently kept `onerror` and skipped hooks.

**Traps hit while building**
- `TodoLinkInput` has no `label`: the picker returns `{kind,key,label}`, so every
  client call strips to `{kind,key}` (sending label = "unknown field").
- Read-only guard: `/api/todo/` is exempt by prefix (`READ_ONLY_EXEMPT_PREFIXES`
  in `hooks.server.js`), mirroring the backend; the stale-check fetch observer in
  `+layout.svelte` skips it too.
