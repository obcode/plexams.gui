// @ts-check
import { expect, test } from '@playwright/test';

// What a planner reads when something is refused: the read-only role, a protected
// semester, a published plan, a broken answer and a busy server. These tests change
// state (they protect the semester and tick checklist steps), so they run only
// against a throwaway copy of the database, with a backend that has auth enabled and
// knows the two users below. `plexams.dev/scripts/e2e-errors.sh` sets all of that up
// and sets E2E_ERRORS; without it the whole file is skipped.

test.skip(!process.env.E2E_ERRORS, 'runs only via plexams.dev/scripts/e2e-errors.sh');
test.describe.configure({ mode: 'serial' });

const PLANER = { 'x-remote-user': 'planer@e2e.test' };
const VIEWER = { 'x-remote-user': 'viewer@e2e.test' };

// Words of the backend's old English messages. None of them may reach the screen.
const ENGLISH = /forbidden|read-only|is locked|is running|no rows|internal system error/i;

/**
 * POST to an /api proxy as the page's user.
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 * @param {Record<string, any>} [data]
 */
async function post(page, path, data = {}) {
	const res = await page.request.post(path, { data });
	return { status: res.status(), body: await res.json().catch(() => ({})) };
}

test.describe('Rolle VIEWER', () => {
	test.use({ extraHTTPHeaders: VIEWER });

	test('die Leiste sagt, dass der Zugang nur lesen darf', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Nur-Lese-Zugang')).toBeVisible();
	});

	test('ein Schreibversuch wird auf Deutsch abgelehnt', async ({ page }) => {
		await page.goto('/');
		const { status, body } = await post(page, '/api/semester/setPlanningCondition', {
			key: 'zpaImported',
			done: true
		});
		expect(status).toBeGreaterThanOrEqual(400);
		expect(body.error).toContain('nur lesen');
		expect(body.error).not.toMatch(ENGLISH);
	});
});

test.describe('Rolle PLANER', () => {
	test.use({ extraHTTPHeaders: PLANER });

	test('geschütztes Semester: Hinweis in der Leiste und erklärte Ablehnung', async ({ page }) => {
		await page.goto('/');
		try {
			const set = await post(page, '/api/semester/setSemesterReadOnly', { readOnly: true });
			expect(set.status).toBe(200);

			await page.goto('/');
			await expect(page.getByText('Dieses Semester ist geschützt')).toBeVisible();

			const { status, body } = await post(page, '/api/semester/setPlanningCondition', {
				key: 'zpaImported',
				done: true
			});
			// Refused either by the GUI's own gate (423) or, while its 5 s cache still
			// says "not protected", by the backend (400 with the code).
			expect(status === 423 || body.code === 'SEMESTER_READ_ONLY').toBe(true);
			expect(body.error).toContain('geschützt');
			expect(body.error).not.toMatch(ENGLISH);
		} finally {
			await post(page, '/api/semester/setSemesterReadOnly', { readOnly: false });
		}
	});

	test('veröffentlichter Raumplan: Zurücksetzen wird erklärt, die Startseite nennt die Sperre', async ({
		page
	}) => {
		await page.goto('/');
		try {
			const set = await post(page, '/api/semester/setPlanningCondition', {
				key: 'roomPlanPublished',
				done: true
			});
			expect(set.status).toBe(200);

			const { status, body } = await post(page, '/api/room/resetRoomsForExams');
			expect(status).toBe(400);
			expect(body.code).toBe('PUBLISHED_LOCKED');
			expect(body.error).toContain('veröffentlicht');
			expect(body.error).not.toMatch(ENGLISH);

			await page.goto('/');
			await expect(page.getByText('Die Räume lassen sich nicht mehr neu generieren')).toBeVisible();
		} finally {
			await post(page, '/api/semester/setPlanningCondition', {
				key: 'roomPlanPublished',
				done: false
			});
		}
	});

	test('eine gescheiterte Status-Abfrage wird gemeldet statt verschluckt', async ({ page }) => {
		await page.route('**/api/backup/status', (route) => route.abort('failed'));
		await page.goto('/');
		await expect(page.getByText('Plexams konnte nicht prüfen')).toBeVisible();
		await expect(page.getByText('Der Plexams-Server antwortet gerade nicht.')).toBeVisible();
		await expect(page.getByText('Failed to fetch')).toHaveCount(0);
	});

	test('eine kaputte Antwort landet nicht als Daten in der Seite', async ({ page }) => {
		await page.route('**/api/exam/allProgramsInPlan', (route) =>
			route.fulfill({ status: 502, contentType: 'text/html', body: '<html>Bad Gateway</html>' })
		);
		await page.goto('/plan/exams');
		await expect(page.getByText('Die Filterlisten')).toBeVisible();
	});

	test('ein abgelehnter Lauf zeigt den Grund und kein grünes „fertig"', async ({ page }) => {
		// The server's side of graphql-ws, answering every subscription with the
		// refusal a busy backend sends: one coded ERROR line, then DONE.
		await page.routeWebSocket(/\/query/, (ws) => {
			ws.onMessage((raw) => {
				const msg = JSON.parse(String(raw));
				if (msg.type === 'connection_init') {
					ws.send(JSON.stringify({ type: 'connection_ack' }));
				} else if (msg.type === 'subscribe') {
					const field = /subscription[^{]*\{\s*(\w+)/.exec(msg.payload.query)?.[1] ?? '';
					/** @param {Record<string, any>} line */
					const next = (line) =>
						ws.send(
							JSON.stringify({ id: msg.id, type: 'next', payload: { data: { [field]: line } } })
						);
					next({ level: 'ERROR', text: 'Fehler: busy', code: 'BUSY' });
					next({ level: 'DONE', text: 'done', code: null });
					ws.send(JSON.stringify({ id: msg.id, type: 'complete' }));
				}
			});
		});

		await page.goto('/plan/rooms/generate');
		// The button exists in the server-rendered page before it reacts to a click.
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: '▷ Probelauf' }).click();

		await expect(page.getByText('im Hintergrund noch etwas läuft').first()).toBeVisible();
		await expect(page.getByText('fertig', { exact: true })).toHaveCount(0);
	});
});
