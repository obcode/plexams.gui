# .claude/

Versioniertes Claude-Code-Projektgedächtnis, damit es DevContainer-Rebuilds übersteht
(der Workspace liegt auf einem persistenten Named Volume, `~/.claude` im Home dagegen
ist flüchtig).

- `memory/` — die Memory-Dateien (Projektwissen). `MEMORY.md` ist der Index, der pro
  Session geladen wird; die übrigen `*.md` sind einzelne Fakten.
- `settings.json` — bewusst schlanke Berechtigungen (pnpm, svelte-check), die auch für
  einen Standalone-Clone dieses Repos stimmen. Keine eingefrorenen Einmal-Kommandos,
  keine absoluten Pfade einer bestimmten Maschine. `settings.local.json` ist gitignored
  und gehört nie ins Repo.

Claude liest/schreibt Memory unter
`~/.claude/projects/-workspace-plexams-gui/memory/`. Dieser Pfad ist ein **Symlink**
auf `./.claude/memory/`, damit Änderungen direkt hier (versioniert) landen.

Seit dem Wechsel auf den **kombinierten DevContainer** (Repo `plexams.dev`, 2026-07-29)
wird dieser Symlink zentral in `plexams.dev/.devcontainer/post-create.sh` angelegt. Die
frühere Variante — ein `postCreateCommand` im eigenen `devcontainer`-Branch dieses
Repos — ist damit gegenstandslos. Dasselbe Skript verlinkt die Memory-Verzeichnisse
aller Repos und hängt die beiden Repo-Memories zusätzlich unter dem geteilten
Verzeichnis als `go/` und `gui/` ein.

Ebenfalls im kombinierten Container: eine gemeinsame `CLAUDE.md` auf Workspace-Ebene
(`/workspace/CLAUDE.md`, verlinkt aus `plexams.dev`) mit Layout, Glossar,
Cross-Repo-Workflow und Git-Konventionen. Die `CLAUDE.md` dieses Repos ergänzt sie und
bleibt eigenständig lesbar.

Nicht versioniert wird der Rest von `~/.claude` (Auth-Tokens in `.credentials.json`,
Sessions, Verlauf) — der gehört nicht ins Repo.
