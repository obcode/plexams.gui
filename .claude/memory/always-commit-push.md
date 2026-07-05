---
name: always-commit-push
description: "User wants every completed change committed and pushed immediately, no asking"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 051e7f76-63c0-4d5e-8efa-a170672108de
---

Nach jeder abgeschlossenen, verifizierten Änderung **sofort committen und pushen** — nicht erst fragen. Direkt auf `main` (so arbeitet der User, siehe git log).

**Why:** Der User hat mehrfach „committen und pushen" nachgeschoben und dann explizit gesagt „Immer gleich committen und pushen."

**How to apply:** Arbeit fertigstellen + verifizieren (Playwright/Tests/`pnpm check`), dann `git add <die geänderten Dateien> && git commit && git push`. Commit-Message wie gewohnt (deutsch, `Co-Authored-By: Claude …`). Nur die zur Aufgabe gehörenden Dateien stagen, keine fremden Working-Tree-Änderungen. Trotzdem: bei riskanten/irreversiblen Dingen weiter kurz rückfragen.

**Memory mit committen:** Das Agent-Memory unter `.claude/memory/` ist im Repo versioniert und soll ebenfalls immer mitcommittet und gepusht werden — entweder im selben Commit wie das zugehörige Feature oder in einem eigenen `chore(memory): …`-Commit. Nicht mehr aus den Commits raushalten.
