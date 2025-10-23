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

Nach dem Erstellen des Containers werden automatisch ausgeführt:

- `npm install` - Installation aller Dependencies
- `npx playwright install --with-deps` - Installation von Playwright und Browser-Dependencies

## Entwicklungsbefehle

Nach dem Start des DevContainers können Sie folgende Befehle nutzen:

```bash
npm run dev          # Startet den Dev-Server
npm run build        # Baut das Projekt
npm run preview      # Startet den Preview-Server
npm run check        # TypeScript & Svelte Check
npm run lint         # ESLint & Prettier Check
npm run format       # Code formatieren
npm run test         # Unit & E2E Tests
npm run test:unit    # Nur Unit Tests
npm run test:e2e     # Nur E2E Tests
```
