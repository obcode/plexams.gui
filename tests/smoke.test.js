// @ts-check
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// Smoke-Tests: jede parametrfreie Seite muss serverseitig rendern (HTTP < 400 →
// kein 500 aus einem geworfenen load()) und das Layout (Nav) aufbauen. Läuft
// gegen das echte Test-Backend (Test26SS). Fängt kaputte Loads, fehlende
// Felder und Render-Crashes breitflächig ab — bewusst flach statt tief.
//
// Parametrisierte Routen (/exam/assembledExams/[ancode] usw.) sind hier NICHT
// abgedeckt — die brauchen echte IDs; separater Follow-up.

// Every parameter-free page of the planner, read from the route folders, so a new
// page is covered without anyone remembering to list it here.
const ROUTES_DIR = fileURLToPath(new URL('../src/routes/(planner)', import.meta.url));
const ROUTES = readdirSync(ROUTES_DIR, { recursive: true, encoding: 'utf8' })
	.filter((f) => f === '+page.svelte' || f.endsWith('/+page.svelte'))
	.map((f) => '/' + f.replace(/\/?\+page\.svelte$/, ''))
	.filter((route) => !route.includes('['))
	.sort();

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
