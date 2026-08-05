---
name: error-reporting-obs
description: Fehler-Telemetrie der GUI — Scrubber in src/lib/obs, Tunnel über /monitoring, die vier Fallen (CSRF/ORIGIN, GlitchTip-403, Selbst-Breadcrumbs, dynamic public env im Dev)
metadata:
  type: project
---

Phase 3b des Monitoring-Plans (`plexams.dev/.claude/plans/monitoring-plattform.md`) ist
umgesetzt und mit Chromium gegen ein echtes GlitchTip geprüft. Drei Commits auf `main`, der
Scrubber zuerst — er muss stehen, bevor irgendetwas senden kann. Das Gegenstück im Backend
ist `plexams.go/.claude/memory/error-reporting-obs.md`.

## Aufbau

| Datei | Rolle |
| --- | --- |
| `src/lib/obs/scrub.js` | `beforeSend`/`beforeBreadcrumb`, Positivlisten. **Vor jeder Änderung lesen.** |
| `src/lib/obs/options.js` | was auf beiden Seiten gleich sein muss (damit der Scrubber nirgends fehlt) |
| `src/lib/obs/dsn.js` | DSN zerlegen — der Tunnel braucht Ziel *und* Herkunftsprüfung |
| `src/hooks.server.js` | `Sentry.init` auf Modulebene, `sequence(sentryHandle(), authHandle)`, `handleError` |
| `src/hooks.client.js` | dasselbe im Browser, mit `tunnel` |
| `src/routes/monitoring/+server.js` | der Tunnel |
| `src/routes/+error.svelte` | die Fehlerseite, die es vorher nicht gab |

Umgebungsvariablen: `SENTRY_DSN` (privat, SSR **und** Tunnelziel), `PUBLIC_SENTRY_DSN`
(Browser), `PUBLIC_SENTRY_ENVIRONMENT`, `PUBLIC_SENTRY_TUNNEL` (Standard `/monitoring`,
`off` schaltet auf den direkten Weg).

## Der schärfste Leckweg ist hier ein anderer als im Backend

Nicht Logfelder, sondern zwei Dinge, die das SDK von sich aus mitschickt:

1. **Request-Bodies.** 128 der 134 `/api`-Proxys reichen den Browser-Body ans Backend
   durch; bei `addNTA` stehen darin Name, Mailadresse und Matrikelnummer. `data`,
   `query_string` und `cookies` sind deshalb gar nicht erst im neu gebauten
   `request`-Objekt.
2. **Breadcrumbs.** Für jeden `fetch` und jede Navigation legt das SDK einen an, samt
   vollständiger URL.

## Vier Fallen, alle beim Gegentest bezahlt

**1. SvelteKits CSRF-Prüfung killt den Tunnel — lautlos.** Das SDK schickt den Envelope als
`text/plain`, und genau dieser Content-Type löst die Prüfung aus. Ohne `ORIGIN` leitet
adapter-node hinter Caddy einen Origin aus dem internen Hop ab, die Prüfung schlägt fehl,
und es kommt **403 „Cross-site POST form submissions are forbidden"** zurück: keine kaputte
Seite, keine Logzeile, einfach keine Browser-Events. `ORIGIN: https://${SERVER_NAME}` steht
seit `fd57b25` in `plexams.dev/deploy/docker-compose.yml`. Dass es bis dahin nie aufgefallen
ist, liegt nur daran, dass alle `/api`-Aufrufe JSON senden — das ignoriert die Prüfung.

**2. GlitchTip authentifiziert einen getunnelten Envelope nicht an der DSN in seinem Kopf.**
Ohne `?sentry_key=` in der Ziel-URL: 403. Sentrys offizielles Tunnel-Beispiel lässt den
Schlüssel weg und funktioniert deshalb nur gegen sentry.io. Deshalb baut `parseDsn` ihn in
`ingestUrl` ein.

**3. Das SDK protokolliert seine eigenen Uploads.** Über den Tunnel sind das serverseitig
zwei bis drei `http`-Breadcrumbs pro Browser-Event, die im nächsten echten Bericht stehen
und das 20er-Budget auffressen. `scrubBreadcrumb` wirft sie am Protokollpfad weg
(`/envelope/`, `/monitoring`) — hostnamenunabhängig.

**4. `$env/dynamic/public` liest im `vite dev` NICHT aus der Prozessumgebung**, sondern aus
`.env`. Ein `PUBLIC_SENTRY_DSN=… pnpm dev` wirkt also serverseitig, aber nicht im Browser —
`/_app/env.js` zeigt, was tatsächlich ankommt. In der Produktion (adapter-node) sind es echte
Prozessvariablen. Zum Gegentesten des Browser-Wegs deshalb `pnpm build` und
`node build/index.js`, nicht `pnpm dev`.

## Bewusst nicht eingebaut

- **`sentrySvelteKit()` in `vite.config.js`** — dient Source-Map-Upload und
  Load-Instrumentierung, beides nicht gewollt. Folge: Stacktraces bleiben minifiziert.
  Source Maps wären ein eigener Schritt.
- **Session Replay.** Eine Videoaufzeichnung der Oberfläche ist eine Videoaufzeichnung der
  Matrikelnummern darauf. Gehört zu keiner Voreinstellung; es müsste ausdrücklich
  eingebunden werden. Also nicht.
- **`@sentry/cli`-Postinstall** — in `pnpm-workspace.yaml` auf `false`. Es lädt nur die
  Binärdatei für den Source-Map-Upload. Ohne die Entscheidung schlägt `pnpm install` fehl.

## Gegentesten

GlitchTip lokal aus `obcode/monitoring`, Projekt `plexams-gui`; Aufbau und die
Volume-Passwort-Falle stehen in der Backend-Notiz. Der aussagekräftige Durchlauf:
Produktionsbuild starten, mit Chromium eine Seite laden, im Browser einen Fehler mit
Matrikelnummer im Text werfen — im Bericht muss `Student [mtknr]` stehen, es dürfen **null**
POSTs direkt an den Monitoring-Host gehen, und der `User-Agent` muss der einzige überlebende
Header sein.
