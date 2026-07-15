---
name: check-before-commit
description: "Always run `pnpm run check` and ensure it passes before every commit"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 89f26fe2-1c41-4de9-be92-291069c98259
---

Before **every** commit, run `pnpm run check` (svelte-check) and make sure it reports no errors/warnings before committing.

**Why:** The user wants type-checking to gate every commit so broken types never land on main.

**How to apply:** After finishing edits and before `git commit`, run `pnpm run check`; only commit once it passes. Combine with [[always-commit-push]] (commit+push finished changes immediately) — the check is the gate that runs first.
