import { existsSync, readdirSync } from 'node:fs';
import { chromium, defineConfig, devices } from '@playwright/test';

// The DevContainer bakes one Chromium build into its image, and @playwright/test
// expects exactly the build of its own version. A dependency update of Playwright
// therefore used to break every e2e test until the image was rebuilt ("Executable
// doesn't exist"). If the expected build is missing but another one is installed,
// use that one: for smoke tests any recent Chromium is as good.
function installedChromium() {
	if (existsSync(chromium.executablePath())) return undefined;
	const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
	if (!root || !existsSync(root)) return undefined;
	const builds = readdirSync(root)
		.filter((d) => d.startsWith('chromium_headless_shell-'))
		.sort()
		.reverse();
	for (const build of builds) {
		const exe = `${root}/${build}/chrome-headless-shell-linux64/chrome-headless-shell`;
		if (existsSync(exe)) {
			console.warn(
				`[playwright] expected Chromium build is not installed, using ${build}. ` +
					'Rebuild the DevContainer with the matching PLAYWRIGHT_VERSION to silence this.'
			);
			return exe;
		}
	}
	return undefined;
}
const executablePath = installedChromium();

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
		// E2E_BASE_URL: run against an already running GUI (see tests/README.md).
		baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// /dev/shm ist im Container nur 64 MB → Chromium sonst „Page crashed".
				launchOptions: { args: ['--disable-dev-shm-usage'], executablePath }
			}
		}
	],
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				// npm (nicht pnpm): der webServer-Subprozess erbt sonst den corepack-
				// Versions-Check und bricht bei pnpm-Minor-Drift ab.
				command: 'npm run build && npm run preview',
				port: 4173,
				// Build kann dauern; großzügiges Timeout.
				timeout: 180_000,
				reuseExistingServer: !process.env.CI
			}
});
