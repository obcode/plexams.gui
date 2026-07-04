# DevContainer Setup für Peak Client

Dieser DevContainer bietet eine vollständige Entwicklungsumgebung für das SvelteKit-Projekt.

## Features

- **Node.js**: LTS Version mit allen erforderlichen Build-Tools
- **VS Code Extensions**:
  - Svelte Language Support
  - ESLint & Prettier
  - Tailwind CSS IntelliSense
  - GraphQL Support
  - Playwright Test Runner
  - Vitest Explorer

- **Git Integration**:
  - SSH-Keys vom Host gemountet (read-only)
  - Git-Konfiguration vom Host gemountet (read-only)

- **Server-Verbindung**:
  - GRAPHQL_SERVER und PDF_SERVER nutzen `host.docker.internal:50051`
  - Zugriff auf Services, die auf dem Host-Port 50051 laufen

## Verwendung

1. Öffnen Sie VS Code
2. Installieren Sie die Extension "Dev Containers" (ms-vscode-remote.remote-containers)
3. Öffnen Sie die Command Palette (Cmd+Shift+P)
4. Wählen Sie "Dev Containers: Reopen in Container"

## Verfügbare Ports

- **5173**: SvelteKit Development Server (automatische Benachrichtigung)
- **4173**: SvelteKit Preview Server

## Umgebungsvariablen

Die folgenden Umgebungsvariablen werden automatisch im Container gesetzt:

- `GRAPHQL_SERVER=http://host.docker.internal:50051/query`
- `PDF_SERVER=http://host.docker.internal:50051/pdfs`

Andere Umgebungsvariablen sollten in der `.env` Datei im Projekt-Root definiert werden.

## Post-Create Command

Nach dem Erstellen des Containers wird automatisch ausgeführt:

- `pnpm install` - Installation aller Dependencies (pnpm via Corepack, Version aus dem `packageManager`-Feld)

Playwright-Browser bei Bedarf einmalig nachinstallieren: `pnpm exec playwright install --with-deps`.

## Entwicklungsbefehle

Nach dem Start des DevContainers können Sie folgende Befehle nutzen:

```bash
pnpm dev             # Startet den Dev-Server
pnpm build           # Baut das Projekt
pnpm preview         # Startet den Preview-Server
pnpm check           # TypeScript & Svelte Check
pnpm lint            # Prettier Check (ESLint ist nicht konfiguriert)
pnpm format          # Code formatieren
pnpm test            # Unit Tests (Vitest)
pnpm test:e2e        # E2E Tests (Playwright)
```
