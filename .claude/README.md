# .claude/

Versioniertes Claude-Code-Projektgedächtnis, damit es DevContainer-Rebuilds übersteht
(der Workspace liegt auf einem persistenten Named Volume, `~/.claude` im Home dagegen
ist flüchtig).

- `memory/` — die Memory-Dateien (Projektwissen). `MEMORY.md` ist der Index, der pro
  Session geladen wird; die übrigen `*.md` sind einzelne Fakten.

Claude liest/schreibt Memory unter
`~/.claude/projects/-workspace-plexams-gui/memory/`. Dieser Pfad ist ein **Symlink**
auf `./.claude/memory/`, damit Änderungen direkt hier (versioniert) landen.

Der Symlink wird beim Container-Start über `postCreateCommand` in
`.devcontainer/devcontainer.json` (Branch `devcontainer`) neu angelegt:

```sh
mkdir -p "$HOME/.claude/projects/-workspace-plexams-gui" \
  && mkdir -p "$PWD/.claude/memory" \
  && ln -sfn "$PWD/.claude/memory" "$HOME/.claude/projects/-workspace-plexams-gui/memory"
```

Nicht versioniert wird der Rest von `~/.claude` (Auth-Tokens in `.credentials.json`,
Sessions, Verlauf) — der gehört nicht ins Repo.
