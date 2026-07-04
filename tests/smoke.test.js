// @ts-check
import { expect, test } from '@playwright/test';

// Smoke-Tests: jede parametrfreie Seite muss serverseitig rendern (HTTP < 400 →
// kein 500 aus einem geworfenen load()) und das Layout (Nav) aufbauen. Läuft
// gegen das echte Test-Backend (Test26SS). Fängt kaputte Loads, fehlende
// Felder und Render-Crashes breitflächig ab — bewusst flach statt tief.
//
// Parametrisierte Routen (/exam/assembledExams/[ancode] usw.) sind hier NICHT
// abgedeckt — die brauchen echte IDs; separater Follow-up.

const ROUTES = [
	'/',
	'/config',
	'/config/new',
	'/email',
	'/email/attachments',
	'/email/specialInterests',
	'/exam/assembledExams',
	'/exam/connected',
	'/exam/examersToPlan',
	'/exam/examsToPlan',
	'/invigilators',
	'/log',
	'/nta/all',
	'/nta/semester',
	'/plan/annyBookings',
	'/plan/exams',
	'/plan/exams/generate',
	'/plan/exams/roomsphase',
	'/plan/exams/validate',
	'/plan/external',
	'/plan/invigilation',
	'/plan/invigilation/constraints',
	'/plan/invigilation/generate',
	'/plan/invigilation/planning',
	'/plan/invigilation/validate',
	'/plan/kdprooms',
	'/plan/roomRequests',
	'/plan/rooms',
	'/plan/rooms/validate',
	'/preplan',
	'/primuss/exams',
	'/primuss/mucdai',
	'/rooms',
	'/students',
	'/studyprograms',
	'/validate',
	'/zpa/additionalExams',
	'/zpa/publish',
	'/zpa/teacher'
];

for (const path of ROUTES) {
	test(`rendert ${path}`, async ({ page }) => {
		// 'commit' statt 'domcontentloaded': manche Seiten (z. B. /validate) starten
		// beim Mount kontinuierliche Validierungs-Streams, sodass domcontentloaded/
		// load nie settlen. Wir wollen nur die SSR-Antwort + das gerenderte Layout.
		const resp = await page.goto(path, { waitUntil: 'commit' });
		expect(resp, `keine Antwort für ${path}`).not.toBeNull();
		expect(resp?.status(), `HTTP-Status für ${path}`).toBeLessThan(400);
		// Layout hat aufgebaut → SSR nicht abgestürzt (nav ist im SSR-HTML enthalten).
		await expect(page.locator('nav').first()).toBeAttached();
	});
}

test('Startseite ist die Plexams-App (kein SvelteKit-Scaffold)', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle(/Plexams/i);
});
