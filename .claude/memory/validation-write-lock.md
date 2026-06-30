---
name: validation-write-lock
description: Backend blocks all mutations while any validation subscription runs
metadata:
  node_type: memory
  type: project
  originSessionId: 64695025-3401-4f38-9ba3-5dbc6da2c4b9
---

The plexams backend has a gqlgen middleware that rejects **all** write mutations while _any_ validation subscription is running ("writes are blocked while a validation is running"); invigilation generation also refuses to write then. Parallel validations are allowed (counter-guarded).

**Why:** This shaped the GUI's validation-status design. The Nav-bar validation indicator deliberately does NOT poll/auto-run on a timer — that would intermittently block saving on every page. Instead it shows the last known result from a shared store ([[validation-architecture]]) and only re-runs validators on explicit click ("jetzt prüfen") or when a validation page is visited.

**How to apply:** When adding more validators or any background/automatic validation, never run them on an interval from a globally-mounted component. Keep validation on-demand or page-scoped.
