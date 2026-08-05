import { describe, expect, it } from 'vitest';
import { redact, redactUrl, scrubBreadcrumb, scrubEvent } from './scrub';

// Erfundene Werte. Nichts hier stammt aus dem semester-Repo — siehe CLAUDE.md.
const MTKNR = '12345678';
const NAME = 'Erika Musterfrau';
const MAIL = 'erika.musterfrau@hm.edu';

/** Die Zusicherung, für die es diese Datei gibt. */
function expectClean(/** @type {unknown} */ value) {
	const text = JSON.stringify(value) ?? '';
	for (const forbidden of [MTKNR, NAME, MAIL, 'hm.edu', '@']) {
		expect(text, `enthält ${forbidden}: ${text}`).not.toContain(forbidden);
	}
}

describe('redact', () => {
	it('ersetzt Matrikelnummer und Mailadresse', () => {
		expect(redact(`Student ${MTKNR} <${MAIL}> nicht gefunden`)).toBe(
			'Student [mtknr] <[email]> nicht gefunden'
		);
	});

	it('lässt Ancodes und Jahreszahlen stehen', () => {
		expect(redact('Prüfung 1234 im Jahr 2026 kollidiert mit 987')).toBe(
			'Prüfung 1234 im Jahr 2026 kollidiert mit 987'
		);
	});

	it('kommt mit null und undefined klar', () => {
		expect(redact(null)).toBe('');
		expect(redact(undefined)).toBe('');
	});
});

describe('redactUrl', () => {
	it('wirft den Query-String weg', () => {
		expect(redactUrl(`/api/nta/get?mtknr=${MTKNR}&name=${NAME}`)).toBe('/api/nta/get');
	});

	it('redigiert Pfadsegmente', () => {
		expect(redactUrl(`/nta/${MTKNR}`)).toBe('/nta/[mtknr]');
	});

	it('behält den Host bei absoluten URLs', () => {
		expect(redactUrl(`https://plexams.example/nta/${MTKNR}?x=1#y`)).toBe(
			'https://plexams.example/nta/[mtknr]'
		);
	});

	it('wirft auch das Fragment weg', () => {
		expect(redactUrl('/plan/exams#abschnitt')).toBe('/plan/exams');
	});
});

describe('scrubEvent', () => {
	it('verwirft jeden Tag, der nicht ausdrücklich erlaubt ist', () => {
		const event = scrubEvent(
			/** @type {any} */ ({
				tags: {
					semester: '2026-SS',
					ancode: '1234',
					mtknr: MTKNR,
					name: NAME,
					email: MAIL,
					// Der eigentliche Beweis: ein Schlüssel, den es nirgends
					// gibt, also der, den jemand nächstes Jahr hinzufügt.
					frisch_erfunden: 'egal'
				}
			})
		);

		expect(event?.tags).toEqual({ semester: '2026-SS', ancode: '1234' });
		expectClean(event);
	});

	it('wirft Body, Query-String und Cookies des Requests weg', () => {
		const event = scrubEvent(
			/** @type {any} */ ({
				request: {
					method: 'POST',
					url: `https://plexams.example/api/nta/add?mtknr=${MTKNR}`,
					query_string: `mtknr=${MTKNR}`,
					data: { name: NAME, email: MAIL, mtknr: MTKNR },
					cookies: { _oauth2_proxy: 'geheim' },
					headers: {
						'X-Remote-User': MAIL,
						Cookie: '_oauth2_proxy=geheim',
						'User-Agent': 'Mozilla/5.0'
					}
				}
			})
		);

		expect(event?.request?.method).toBe('POST');
		expect(event?.request?.url).toBe('https://plexams.example/api/nta/add');
		expect(event?.request?.data).toBeUndefined();
		expect(event?.request?.query_string).toBeUndefined();
		expect(event?.request?.cookies).toBeUndefined();
		expect(event?.request?.headers).toEqual({ 'User-Agent': 'Mozilla/5.0' });
		expectClean(event);
	});

	it('reduziert den Nutzer auf das Pseudonym', () => {
		const event = scrubEvent(
			/** @type {any} */ ({
				user: { id: 'u_abc123', email: MAIL, username: MAIL, ip_address: '10.28.1.184' }
			})
		);

		expect(event?.user).toEqual({ id: 'u_abc123' });
	});

	it('lässt einen Nutzer ohne Pseudonym ganz weg', () => {
		const event = scrubEvent(/** @type {any} */ ({ user: { email: MAIL } }));
		expect(event?.user).toBeUndefined();
		expectClean(event);
	});

	it('redigiert Meldung, Transaktion und Fehlertexte', () => {
		const event = scrubEvent(
			/** @type {any} */ ({
				message: `Fehler für ${MTKNR}`,
				transaction: `/nta/${MTKNR}`,
				exception: { values: [{ type: 'Error', value: `${MAIL} unbekannt` }] }
			})
		);

		expect(event?.message).toBe('Fehler für [mtknr]');
		expect(event?.transaction).toBe('/nta/[mtknr]');
		expectClean(event);
	});

	it('wirft extra weg und behält nur bekannte Contexts', () => {
		const event = scrubEvent(
			/** @type {any} */ ({
				extra: { input: { mtknr: MTKNR } },
				contexts: { browser: { name: 'Firefox' }, state: { store: { mtknr: MTKNR } } }
			})
		);

		expect(event?.extra).toBeUndefined();
		expect(event?.contexts).toEqual({ browser: { name: 'Firefox' } });
		expectClean(event);
	});

	it('reicht Breadcrumbs durch den Breadcrumb-Filter', () => {
		const event = scrubEvent(
			/** @type {any} */ ({
				breadcrumbs: [
					{ category: 'fetch', data: { url: `/api/nta/get?mtknr=${MTKNR}`, method: 'POST' } },
					{ category: 'console', message: `Anmeldung von ${MAIL}` }
				]
			})
		);

		expect(event?.breadcrumbs).toHaveLength(1);
		expect(event?.breadcrumbs?.[0].data).toEqual({ url: '/api/nta/get', method: 'POST' });
		expectClean(event);
	});
});

describe('scrubBreadcrumb', () => {
	it('redigiert die URL eines fetch — der häufigste Fall', () => {
		const crumb = scrubBreadcrumb(
			/** @type {any} */ ({
				category: 'fetch',
				data: { url: `/api/nta/get?mtknr=${MTKNR}`, method: 'POST', status_code: 400 }
			})
		);

		expect(crumb?.data).toEqual({ url: '/api/nta/get', method: 'POST', status_code: 400 });
	});

	it('redigiert Navigationen', () => {
		const crumb = scrubBreadcrumb(
			/** @type {any} */ ({
				category: 'navigation',
				data: { from: '/nta/all', to: `/nta/${MTKNR}` }
			})
		);

		expect(crumb?.data).toEqual({ from: '/nta/all', to: '/nta/[mtknr]' });
	});

	it('verwirft Konsolenausgaben ganz', () => {
		expect(scrubBreadcrumb(/** @type {any} */ ({ category: 'console', message: MAIL }))).toBeNull();
	});

	it('verwirft unbekannte Datenfelder', () => {
		const crumb = scrubBreadcrumb(
			/** @type {any} */ ({ category: 'ui.click', data: { mtknr: MTKNR, ancode: '1234' } })
		);

		expect(crumb?.data).toEqual({ ancode: '1234' });
		expectClean(crumb);
	});
});
