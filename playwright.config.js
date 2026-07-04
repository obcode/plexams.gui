import { defineConfig, devices } from '@playwright/test';

// E2E-Smoke-Tests laufen gegen die Produktions-Vorschau (adapter-node) auf :4173,
// die ihrerseits das echte GraphQL-Backend unter PLEXAMS_SERVER (Default
// localhost:8080, Test-Semester Test26SS) befragt. Der Browser (Chromium) liegt
// im DevContainer unter PLAYWRIGHT_BROWSERS_PATH=/ms-playwright.
//
// NICHT Teil des CI-Gates (quality.yml) — dort läuft kein Backend. Lokal:
//   corepack pnpm test:e2e
export default defineConfig({
	testDir: 'tests',
	// Einige Seiten machen N+1-Backend-Loads (jeder Slot einzeln) → großzügig.
	timeout: 60_000,
	// Smoke-Tests sind read-only → parallel unbedenklich. Worker klein halten:
	// der DevContainer hat nur 64 MB /dev/shm, zu viele Chromium-Instanzen parallel
	// lassen den Renderer sporadisch crashen (zusätzlich zu --disable-dev-shm-usage
	// unten). 1 Retry fängt einen verbliebenen Ausreißer ab.
	fullyParallel: true,
	workers: 2,
	retries: 1,
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// /dev/shm ist im Container nur 64 MB → Chromium sonst „Page crashed".
				launchOptions: { args: ['--disable-dev-shm-usage'] }
			}
		}
	],
	webServer: {
		// npm (nicht pnpm): der webServer-Subprozess erbt sonst den corepack-
		// Versions-Check und bricht bei pnpm-Minor-Drift ab.
		command: 'npm run build && npm run preview',
		port: 4173,
		// Build kann dauern; großzügiges Timeout.
		timeout: 180_000,
		reuseExistingServer: !process.env.CI
	}
});
