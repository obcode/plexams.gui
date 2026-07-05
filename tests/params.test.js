// @ts-check
import { expect, test } from '@playwright/test';

// Smoke-Tests für die parametrisierten Routen. Die IDs werden zur Laufzeit aus
// demselben Test-Backend (Test26SS) geholt, das die App befragt — so bleibt der
// Test unabhängig von fest verdrahteten Beispiel-IDs.
// (Die frühere Route /exam/examGroups/[code] wurde entfernt — ihr GraphQL-Feld
// `examGroup` existiert nicht mehr im Schema.)

const BACKEND = process.env.PLEXAMS_SERVER || 'http://localhost:8080/query';

/**
 * @param {string} query
 * @returns {Promise<any>}
 */
async function gql(query) {
	const res = await fetch(BACKEND, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	});
	const json = await res.json();
	if (json.errors) throw new Error(`Backend-Query fehlgeschlagen: ${JSON.stringify(json.errors)}`);
	return json.data;
}

/** @type {{ ancode: number, mtknr: string, day: number }} */
let ids;

test.beforeAll(async () => {
	const [exams, ntas, cfg] = await Promise.all([
		gql('{ plannedExams { ancode } }'),
		gql('{ ntasWithRegs { mtknr } }'),
		gql('{ semesterConfig { days { number } } }')
	]);
	ids = {
		ancode: exams.plannedExams[0].ancode,
		mtknr: ntas.ntasWithRegs[0].mtknr,
		day: cfg.semesterConfig.days[0].number
	};
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 */
async function expectRenders(page, path) {
	const resp = await page.goto(path, { waitUntil: 'commit' });
	expect(resp, `keine Antwort für ${path}`).not.toBeNull();
	expect(resp?.status(), `HTTP-Status für ${path}`).toBeLessThan(400);
	await expect(page.locator('nav').first()).toBeAttached();
}

test('rendert /exam/assembledExams/[ancode]', async ({ page }) => {
	await expectRenders(page, `/exam/assembledExams/${ids.ancode}`);
});

test('rendert /nta/[mtknr]', async ({ page }) => {
	await expectRenders(page, `/nta/${ids.mtknr}`);
});

test('rendert /plan/invigilation/[day]', async ({ page }) => {
	await expectRenders(page, `/plan/invigilation/${ids.day}`);
});
