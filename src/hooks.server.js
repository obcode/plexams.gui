import * as Sentry from '@sentry/sveltekit';
import { gql } from 'graphql-request';
import { sequence } from '@sveltejs/kit/hooks';
import * as env from '$app/env/private';
import { authContext, backendProbe, backendRequest, portalProbe } from '#lib/server/backend.js';
import { combine, createAccessCheck, decide } from '#lib/server/accessCheck.js';
import { commonOptions } from '#lib/obs/options.js';

// Fehler-Telemetrie, auf Modulebene: bis der erste Request kommt, muss sie
// stehen. Ohne SENTRY_DSN passiert gar nichts — das ist der Normalfall in der
// Entwicklung und macht diese Datei dort zu genau dem, was sie vorher war.
if (env.SENTRY_DSN) {
	Sentry.init({
		...commonOptions,
		dsn: env.SENTRY_DSN,
		environment: env.SENTRY_ENVIRONMENT,
		release: __APP_VERSION__,
		// Kein OpenTelemetry. Es würde hier ohnehin nur halb greifen (das SDK
		// startet erst, wenn SvelteKit die Module schon geladen hat, also nach
		// dem Zeitpunkt, zu dem OTel http/fetch instrumentieren müsste) — und
		// gebraucht wird es nur für Tracing, das aus ist.
		skipOpenTelemetrySetup: true
	});
}

/**
 * POST-Proxys unter /api, die in Wahrheit Lese-Abfragen sind (Suche, Slot-Lookups,
 * Vorschläge, Validierung). Diese dürfen auch in einem geschützten (read-only)
 * Semester laufen. Alles andere unter /api ist eine Mutation und wird im Schutz-
 * Modus blockiert — neue Mutations-Proxys sind damit automatisch abgedeckt.
 *
 * @type {Set<string>}
 */
const READ_POST_PATHS = new Set([
	// Ausnahmen: dürfen den Schutz selbst ändern bzw. das Semester wechseln —
	// auch wenn das aktuelle Semester read-only ist.
	'/api/semester/setSemester',
	'/api/semester/setSemesterReadOnly',
	// Benutzerverwaltung ist global (OIDC-Auth), nicht semesterbezogen — der
	// Semester-Schutz darf sie nicht blockieren. Zugriff regelt das Backend (ADMIN).
	'/api/admin/setUser',
	'/api/admin/removeUser',
	// Zugang zum Portal für Prüfende (Aliase, Sperren, Tokens): global, nicht
	// semesterbezogen. Zugriff regelt das Backend (ADMIN).
	'/api/access/setLoginAlias',
	'/api/access/removeLoginAlias',
	'/api/access/setPortalLoginBlock',
	'/api/access/removePortalLoginBlock',
	'/api/access/revokePortalAccessToken',
	'/api/access/resolveLogin',
	// Persönliche Kontoeinstellungen (OIDC-Auth) sind global, nicht semesterbezogen
	// — der Semester-Schutz darf sie nicht blockieren. Identität regelt das Backend.
	'/api/account/setShortname',
	'/api/account/setJiraToken',
	'/api/account/removeJiraToken',
	'/api/account/setNotificationMode',
	// Lesestand der Änderungsübersicht des Portals: persönlich, global.
	'/api/inquiry/markActivitySeen',
	// reine Lese-Abfragen:
	'/api/email/renderEmailTemplatePreview',
	'/api/exam/conflictingAncodes',
	'/api/plan/roomsWithFreeSeatsAt',
	'/api/slot/awkwardSlots',
	'/api/plan/roomNamesAt',
	'/api/slot/allowedSlots',
	'/api/preplan/validatePreplanAssignment',
	'/api/primuss/students',
	'/api/plan/slotWithNTAs',
	'/api/slot/preExamsAt',
	'/api/slot/examsAt',
	'/api/plan/roomsAt',
	'/api/plan/roomsWithInvigilationsAt',
	'/api/plan/invigilatorsForDay',
	'/api/plan/plannedRoomForStudent',
	'/api/plan/examsAt',
	'/api/preplan/preplanExamAncodeSuggestions'
]);

/**
 * Präfixe von POST-Proxys, die auch in einem geschützten Semester erlaubt sind.
 * Todos ändern keine Planungsdaten — die Todos eines alten Semesters sollen sich
 * auch dann noch abarbeiten lassen (das Backend nimmt die Todo-Mutationen ebenso
 * vom Semesterschutz aus, nicht aber von der VIEWER-Sperre).
 *
 * @type {string[]}
 */
const READ_ONLY_EXEMPT_PREFIXES = ['/api/todo/'];

/** @param {string} pathname */
export function allowedOnReadOnlySemester(pathname) {
	return (
		READ_POST_PATHS.has(pathname) ||
		READ_ONLY_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))
	);
}

/** HTML-escape für die Einblendung der E-Mail in die „Kein Zutritt"-Seite. */
function escapeHtml(/** @type {string} */ s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Eigenständige „Kein Zutritt"-Antwort ohne Navigation/Layout. Wird ausgeliefert,
 * sobald ein am Proxy angemeldeter Benutzer im Backend nicht freigeschaltet ist —
 * für /api als 403-JSON, sonst als in sich geschlossene HTML-Seite (kein Nav,
 * keine SSR-load()s, die ohnehin alle 401→500 laufen würden).
 *
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {string} remoteUser
 */
function denyResponse(event, remoteUser) {
	if (event.url.pathname.startsWith('/api/')) {
		return Response.json(
			{ error: 'Kein Zutritt — diese Kennung ist nicht freigeschaltet.' },
			{ status: 403 }
		);
	}
	const email = escapeHtml(remoteUser);
	const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Kein Zutritt · Plexams</title>
<style>
	:root { color-scheme: light dark; }
	* { box-sizing: border-box; }
	body {
		margin: 0; min-height: 100vh; display: grid; place-items: center;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		background: #f3f4f6; color: #1f2937; padding: 1.5rem;
	}
	.card {
		background: #fff; max-width: 32rem; width: 100%; border-radius: 1rem;
		padding: 2.5rem 2rem; box-shadow: 0 10px 30px rgba(0,0,0,.08);
		border: 1px solid #e5e7eb; text-align: center;
	}
	.icon { font-size: 3rem; line-height: 1; margin-bottom: .75rem; }
	h1 { margin: 0 0 .75rem; font-size: 1.5rem; }
	p { margin: 0 0 1rem; line-height: 1.55; }
	.email {
		display: inline-block; font-family: ui-monospace, monospace;
		background: #f3f4f6; border-radius: .5rem; padding: .2rem .5rem;
	}
	.muted { color: #6b7280; font-size: .9rem; margin-bottom: 0; }
	a { color: #2563eb; }
	@media (prefers-color-scheme: dark) {
		body { background: #111827; color: #e5e7eb; }
		.card { background: #1f2937; border-color: #374151; box-shadow: none; }
		.email { background: #374151; }
		.muted { color: #9ca3af; }
		a { color: #60a5fa; }
	}
</style>
</head>
<body>
	<main class="card">
		<div class="icon">🚫</div>
		<h1>Kein Zutritt</h1>
		<p>Ihre Kennung <span class="email">${email}</span> ist für die Prüfungsplanung nicht freigeschaltet.</p>
		<p class="muted">Wenden Sie sich an die Prüfungsplanung, um freigeschaltet zu werden.</p>
	</main>
</body>
</html>`;
	return new Response(html, {
		status: 403,
		headers: { 'content-type': 'text/html; charset=utf-8' }
	});
}

/**
 * Ist die vom Proxy gelieferte Kennung im Backend freigeschaltet? Cache je
 * Kennung (30 s), gleichzeitige Anfragen zusammengelegt. Ein Ausfall des
 * Backends ist kein „Kein Zutritt": bekannte Kennungen arbeiten bis zu zehn
 * Minuten mit dem letzten Stand weiter, unbekannte sehen eine 503-Seite.
 * Einzelheiten und Begründung in #lib/server/accessCheck.
 */
const checkAccess = createAccessCheck({
	probe: async () => {
		const [me, session] = await Promise.allSettled([
			backendProbe(gql`
				query {
					me {
						email
					}
				}
			`),
			portalProbe(gql`
				query {
					session {
						email
						name
						isStaff
						teachers {
							id
							fullname
						}
					}
				}
			`)
		]);
		return combine(
			me.status === 'fulfilled' ? { ok: true, data: me.value } : { ok: false, error: me.reason },
			session.status === 'fulfilled'
				? { ok: true, data: session.value }
				: { ok: false, error: session.reason }
		);
	}
});

/**
 * Antwort für eine Portal-Kennung, die eine Seite der Planung aufruft: für /api
 * ein 403-JSON, sonst eine kleine Seite mit dem Weg ins Portal.
 *
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
function portalOnlyResponse(event) {
	if (event.url.pathname.startsWith('/api/')) {
		return Response.json({ error: 'Kein Zutritt zur Prüfungsplanung.' }, { status: 403 });
	}
	const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Kein Zutritt · Plexams</title>
<style>
	:root { color-scheme: light dark; }
	body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; color: #1f2937; }
	.card { background: #fff; max-width: 32rem; width: 100%; border-radius: 1rem; padding: 2.5rem 2rem;
		border: 1px solid #e5e7eb; text-align: center; }
	h1 { margin: 0 0 .75rem; font-size: 1.5rem; }
	p { margin: 0 0 1rem; line-height: 1.55; }
	a { color: #2563eb; }
	@media (prefers-color-scheme: dark) {
		body { background: #111827; color: #e5e7eb; }
		.card { background: #1f2937; border-color: #374151; }
		a { color: #60a5fa; }
	}
</style>
</head>
<body>
	<main class="card">
		<h1>Diese Seite gehört zur Prüfungsplanung</h1>
		<p>Ihre Angaben machen Sie im Portal für Prüfende.</p>
		<p><a href="/portal">Zum Portal</a></p>
	</main>
</body>
</html>`;
	return new Response(html, {
		status: 403,
		headers: { 'content-type': 'text/html; charset=utf-8' }
	});
}

/**
 * Eigenständige Seite für „Backend gerade nicht erreichbar". Lädt sich nach
 * einigen Sekunden selbst neu – meist ist es ein Neustart beim Deploy.
 *
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
function unavailableResponse(event) {
	if (event.url.pathname.startsWith('/api/')) {
		return Response.json(
			{
				error:
					'Die Prüfungsplanung ist gerade nicht erreichbar. Bitte gleich noch einmal versuchen.'
			},
			{ status: 503, headers: { 'retry-after': '10' } }
		);
	}
	const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="refresh" content="10" />
<title>Gleich wieder da · Plexams</title>
<style>
	:root { color-scheme: light dark; }
	body {
		margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		background: #f3f4f6; color: #1f2937;
	}
	.card {
		background: #fff; max-width: 32rem; width: 100%; border-radius: 1rem;
		padding: 2.5rem 2rem; border: 1px solid #e5e7eb; text-align: center;
	}
	h1 { margin: 0 0 .75rem; font-size: 1.5rem; }
	p { margin: 0 0 1rem; line-height: 1.55; }
	.muted { color: #6b7280; font-size: .9rem; margin-bottom: 0; }
	@media (prefers-color-scheme: dark) {
		body { background: #111827; color: #e5e7eb; }
		.card { background: #1f2937; border-color: #374151; }
		.muted { color: #9ca3af; }
	}
</style>
</head>
<body>
	<main class="card">
		<h1>Gleich wieder da</h1>
		<p>Die Prüfungsplanung ist gerade nicht erreichbar – meist wird sie nur neu gestartet.</p>
		<p class="muted">Die Seite lädt sich in wenigen Sekunden selbst neu.</p>
	</main>
</body>
</html>`;
	return new Response(html, {
		status: 503,
		headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': '10' }
	});
}

/** @type {{ value: boolean; expires: number }} */
let roCache = { value: false, expires: 0 };

/** read-only-Status des aktuellen Semesters, ~5s gecacht (1 Klick = 1 Mutation). */
async function isReadOnly() {
	const now = Date.now();
	if (now < roCache.expires) return roCache.value;
	try {
		const data = await backendRequest(gql`
			query {
				semester {
					readOnly
				}
			}
		`);
		roCache = { value: !!data?.semester?.readOnly, expires: now + 5000 };
	} catch {
		// Im Zweifel nicht blockieren — das Backend bleibt der eigentliche Riegel.
		roCache = { value: false, expires: now + 5000 };
	}
	return roCache.value;
}

/**
 * Der Zugangs-Riegel. Exportiert, weil er einzeln getestet wird: `handle` ist
 * unten eine `sequence`, und die verlangt SvelteKits Request-Store, den ein
 * Unit-Test nicht hat.
 *
 * @type {import('@sveltejs/kit/hooks').Handle}
 */
export async function authHandle({ event, resolve }) {
	// Vom Auth-Proxy (nginx/Shibboleth) autoritativ injizierte Identität. Wird
	// als AsyncLocalStorage-Kontext gesetzt, damit jeder serverseitige GraphQL-
	// Call (SSR-load()s, /api-Proxys, isReadOnly unten) sie als X-Remote-User an
	// das Backend weiterreicht — siehe #lib/server/backend.
	const remoteUser = event.request.headers.get('x-remote-user') || undefined;
	const remoteDisplayname = event.request.headers.get('x-remote-displayname') || undefined;
	event.locals.remoteUser = remoteUser;
	event.locals.remoteDisplayname = remoteDisplayname;

	return authContext.run({ remoteUser, remoteDisplayname }, async () => {
		// Zugangs-Riegel: Läuft das GUI hinter dem Auth-Proxy (remoteUser gesetzt),
		// autorisiert das Backend anhand einer E-Mail-Allowlist. Ist die Kennung
		// nicht freigeschaltet, würde jeder Backend-Call 401→500 liefern und die
		// Nav trotzdem erscheinen. Stattdessen hier zentral abfangen und eine
		// eigenständige „Kein Zutritt"-Seite ausliefern — die SSR-load()s der
		// Seiten laufen dann gar nicht erst. Ist das Backend nicht erreichbar,
		// gibt es eine eigene 503-Seite statt „Kein Zutritt". Ohne remoteUser
		// (lokal/Dev) greift der Riegel nicht → Verhalten wie bisher.
		if (remoteUser) {
			const result = await checkAccess(remoteUser);
			event.locals.access = result.access;
			switch (decide(result.access, event.url.pathname)) {
				case 'deny':
					return denyResponse(event, remoteUser);
				case 'unavailable':
					return unavailableResponse(event);
				case 'to-portal':
					return new Response(null, { status: 303, headers: { location: '/portal' } });
				case 'portal-only':
					return portalOnlyResponse(event);
			}
		}

		const { method } = event.request;
		const { pathname } = event.url;
		if (method === 'POST' && pathname.startsWith('/api/') && !allowedOnReadOnlySemester(pathname)) {
			if (await isReadOnly()) {
				return Response.json(
					{ error: 'Semester ist geschützt (nur lesen) — Schreibvorgang abgelehnt.' },
					{ status: 423 }
				);
			}
		}
		return resolve(event);
	});
}

// sentryHandle zuerst: es setzt den Isolations-Scope, in dem alles Weitere
// meldet. Läuft der Zugangs-Riegel davor und wirft, gehörte der Fehler zu
// keinem Request.
export const handle = sequence(Sentry.sentryHandle(), authHandle);

/**
 * Letzte Instanz für alles, was ein `load()` oder ein Endpunkt nicht selbst
 * abfängt. Vorher gab es sie gar nicht: ein solcher Fehler wurde von SvelteKit
 * auf die Konsole geschrieben, landete im Docker-Log-Ring und war weg.
 *
 * 4xx meldet `handleErrorWithSentry` nicht — ein Tippfehler in der URL ist
 * kein Vorfall.
 *
 * @type {import('@sveltejs/kit/hooks').HandleServerError}
 */
function describeError({ kind, error }) {
	// Since SvelteKit 3 every error passes through here, including those thrown with `error()`
	// (portal 403/404, a missing todo) and SvelteKit's own 404s. Those are answers, not
	// failures: they keep their status and message and get no reference.
	if (kind !== 'unknown') return;
	console.error(error);
	return {
		message: 'Unerwarteter Fehler. Die Prüfungsplanung wurde benachrichtigt.',
		// Die Referenz, mit der man aus einem Screenshot den Bericht findet.
		eventId: Sentry.lastEventId()
	};
}

export const handleError = Sentry.handleErrorWithSentry(describeError);
