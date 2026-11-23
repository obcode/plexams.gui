import { describe, expect, it } from 'vitest';
import { ClientError } from 'graphql-request';
import { redact, redactUrl, scrubBreadcrumb, scrubEvent, stripGraphQLPayload } from './scrub';

// Erfundene Werte. Nichts hier stammt aus dem semester-Repo — siehe CLAUDE.md.
const MTKNR = '12345678';
const NAME = 'Erika Musterfrau';
const MAIL = 'someone@example.invalid';

/** Die Zusicherung, für die es diese Datei gibt. */
function expectClean(/** @type {unknown} */ value) {
	const text = JSON.stringify(value) ?? '';
	for (const forbidden of [MTKNR, NAME, MAIL, 'example.invalid', '@']) {
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

	// Sonst protokolliert die Telemetrie sich selbst: über den Tunnel sind das
	// pro getunneltem Browser-Event zwei bis drei http-Breadcrumbs, die im
	// nächsten echten Bericht stehen und das Budget auffressen.
	it.each([
		'http://localhost:8000/api/2/envelope/?sentry_key=abc',
		'https://glitchtip.example/api/2/envelope/',
		'/monitoring'
	])('verwirft den eigenen Upload: %s', (url) => {
		expect(scrubBreadcrumb(/** @type {any} */ ({ category: 'http', data: { url } }))).toBeNull();
	});

	it('behält einen gewöhnlichen /api-Aufruf', () => {
		const crumb = scrubBreadcrumb(
			/** @type {any} */ ({ category: 'http', data: { url: '/api/exam/examLookup' } })
		);
		expect(crumb?.data?.url).toBe('/api/exam/examLookup');
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

describe('GraphQL-Anfragen in Fehlerberichten', () => {
	// Ein echter ClientError aus graphql-request: seine Meldung trägt die ganze
	// Anfrage samt Variablen. Gebaut wie in der Bibliothek, nicht nachgeahmt.
	const clientError = new ClientError(
		/** @type {any} */ ({
			errors: [{ message: 'semester is read-only' }],
			status: 200,
			headers: new Headers()
		}),
		{
			query: 'mutation ($n: String!) { addNTA(name: $n) { mtknr } }',
			variables: { n: 'Erika Musterfrau', remark: 'Freitext mit Gesundheitsdaten' }
		}
	);

	it('schneidet die Anfrage aus der Exception-Meldung', () => {
		const event = /** @type {any} */ ({
			exception: { values: [{ type: 'ClientError', value: clientError.message }] }
		});
		const out = /** @type {any} */ (scrubEvent(event));
		expect(out.exception.values[0].value).toBe('semester is read-only');
		expect(JSON.stringify(out)).not.toContain('Musterfrau');
		expect(JSON.stringify(out)).not.toContain('Freitext');
	});

	it('schneidet sie auch aus Meldung und Breadcrumbs', () => {
		const event = /** @type {any} */ ({
			message: clientError.message,
			breadcrumbs: [{ category: 'http', message: clientError.message }]
		});
		const out = JSON.stringify(scrubEvent(event));
		expect(out).not.toContain('Musterfrau');
		expect(out).not.toContain('variables');
	});

	it('lässt andere Meldungen unverändert', () => {
		expect(stripGraphQLPayload('cannot reach backend: ECONNREFUSED')).toBe(
			'cannot reach backend: ECONNREFUSED'
		);
	});
});

// What Sentry 11 attaches by default unless DATA_COLLECTION says otherwise. The scrubber has to
// hold on its own, so these events are built as the SDK would build them with collection on.
describe('Sentry 11: identity, cookies and query strings', () => {
	const SEARCH = 'Musterfrau';

	/** Every header that names the person, the session or the client address. */
	const IDENTITY_HEADERS = {
		'X-Remote-User': MAIL,
		'X-Remote-Displayname': NAME,
		'X-Remote-Department': 'Fakultät 07',
		'X-Forwarded-Email': MAIL,
		'X-Forwarded-User': MAIL,
		'X-Forwarded-Preferred-Username': 'someone',
		'X-Forwarded-Groups': 'staff',
		'X-Forwarded-For': '192.0.2.10',
		'X-Real-IP': '192.0.2.10',
		Forwarded: 'for=192.0.2.10',
		'X-Auth-Request-Email': MAIL,
		'X-Auth-Request-User': MAIL,
		'X-Auth-Request-Preferred-Username': 'someone',
		'X-Auth-Request-Access-Token': 'fake-access-token',
		'Remote-User': MAIL,
		Authorization: 'Bearer plexams_fake-token',
		Cookie: '_oauth2_proxy=fake-session; theme=dark',
		Referer: `https://plexams.example/nta/semester?q=${SEARCH}&mail=${MAIL}`
	};

	const serverEvent = () =>
		scrubEvent(
			/** @type {any} */ ({
				request: {
					method: 'GET',
					url: `https://plexams.example/exam/examsToPlan?q=${SEARCH}&mail=${encodeURIComponent(MAIL)}`,
					query_string: `q=${SEARCH}&mail=${encodeURIComponent(MAIL)}`,
					cookies: { _oauth2_proxy: 'fake-session' },
					env: { REMOTE_ADDR: '192.0.2.10' },
					data: { name: NAME, email: MAIL },
					headers: { ...IDENTITY_HEADERS, 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' }
				},
				user: { email: MAIL, username: 'someone', ip_address: '192.0.2.10' }
			})
		);

	it.each(Object.keys(IDENTITY_HEADERS))('drops the header %s', (name) => {
		const headers = serverEvent()?.request?.headers ?? {};
		const lower = Object.keys(headers).map((key) => key.toLowerCase());
		expect(lower).not.toContain(name.toLowerCase());
	});

	it('keeps only the harmless headers, whatever their case', () => {
		expect(serverEvent()?.request?.headers).toEqual({
			'User-Agent': 'Mozilla/5.0',
			Accept: 'text/html'
		});
	});

	it('drops cookies, the query string, the body, the environment and the user', () => {
		const event = serverEvent();
		expect(event?.request).toEqual({
			method: 'GET',
			url: 'https://plexams.example/exam/examsToPlan',
			headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' }
		});
		expect(event?.user).toBeUndefined();
		const text = JSON.stringify(event);
		for (const forbidden of [
			MAIL,
			NAME,
			SEARCH,
			'someone',
			'fake-session',
			'fake-token',
			'fake-access-token',
			'192.0.2.10',
			'Fakultät'
		]) {
			expect(text, `contains ${forbidden}`).not.toContain(forbidden);
		}
	});

	it('cuts the query from navigation and fetch breadcrumbs', () => {
		const event = scrubEvent(
			/** @type {any} */ ({
				breadcrumbs: [
					{
						category: 'navigation',
						data: { from: `/nta/semester?q=${SEARCH}`, to: `/plan/exams#${SEARCH}` }
					},
					{
						category: 'fetch',
						data: {
							url: `/api/email/emailAttachments?kind=x&mail=${encodeURIComponent(MAIL)}`,
							method: 'GET',
							status_code: 200,
							request_body_size: 42,
							// What a body-collecting SDK would add to the breadcrumb.
							request_body: JSON.stringify({ name: NAME }),
							response_body: JSON.stringify({ email: MAIL })
						}
					},
					{
						category: 'xhr',
						data: { url: `https://plexams.example/query?variables={"n":"${SEARCH}"}` }
					}
				]
			})
		);

		expect(event?.breadcrumbs?.map((crumb) => crumb.data)).toEqual([
			{ from: '/nta/semester', to: '/plan/exams' },
			{ url: '/api/email/emailAttachments', method: 'GET', status_code: 200 },
			{ url: 'https://plexams.example/query' }
		]);
		expect(JSON.stringify(event)).not.toContain(SEARCH);
		expectClean(event);
	});

	it('keeps the method in a transaction name and cuts its query', () => {
		const event = scrubEvent(
			/** @type {any} */ ({ transaction: `GET /api/jira/issue?key=${SEARCH}` })
		);
		expect(event?.transaction).toBe('GET /api/jira/issue');
	});

	it('cuts a query string out of free text', () => {
		expect(redact(`Failed to fetch /api/jira/issue?key=${SEARCH} (400)`)).toBe(
			'Failed to fetch /api/jira/issue (400)'
		);
		expect(redact(`GET https://plexams.example/nta?q=${SEARCH}#top failed`)).toBe(
			'GET https://plexams.example/nta failed'
		);
		expect(redact('Prüfung 1234: Raum fehlt?')).toBe('Prüfung 1234: Raum fehlt?');
	});

	it('drops the local variables of every stack frame', () => {
		const frame = () => ({
			filename: 'src/lib/server/gqlProxy.js',
			function: 'gqlProxy',
			vars: { variables: { name: NAME, email: MAIL } }
		});
		const event = scrubEvent(
			/** @type {any} */ ({
				exception: { values: [{ type: 'Error', value: 'x', stacktrace: { frames: [frame()] } }] },
				threads: { values: [{ stacktrace: { frames: [frame()] } }] }
			})
		);

		expect(event?.exception?.values?.[0].stacktrace?.frames?.[0]).toEqual({
			filename: 'src/lib/server/gqlProxy.js',
			function: 'gqlProxy'
		});
		expectClean(event);
	});

	it('keeps status and ids of the response and trace contexts, nothing else', () => {
		const event = scrubEvent(
			/** @type {any} */ ({
				contexts: {
					response: {
						status_code: 500,
						headers: { 'set-cookie': '_oauth2_proxy=fake-session' },
						cookies: { _oauth2_proxy: 'fake-session' }
					},
					trace: {
						trace_id: 'a'.repeat(32),
						span_id: 'b'.repeat(16),
						data: { 'url.full': `https://plexams.example/nta?mail=${MAIL}` }
					}
				}
			})
		);

		expect(event?.contexts).toEqual({
			response: { status_code: 500 },
			trace: { trace_id: 'a'.repeat(32), span_id: 'b'.repeat(16) }
		});
		expectClean(event);
	});
});
