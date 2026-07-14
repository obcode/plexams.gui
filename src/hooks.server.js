import { gql } from 'graphql-request';
import { json } from '@sveltejs/kit';
import { authContext, backendRequest } from '$lib/server/backend';

/**
 * POST-Proxys unter /api, die in Wahrheit Lese-Abfragen sind (Suche, Slot-Lookups,
 * Vorschläge, Validierung). Diese dürfen auch in einem geschützten (read-only)
 * Semester laufen. Alles andere unter /api ist eine Mutation und wird im Schutz-
 * Modus blockiert — neue Mutations-Proxys sind damit automatisch abgedeckt.
 *
 * @type {Set<string>}
 */
const READ_POST_PATHS = new Set([
	// Ausnahmen: dürfen den Schutz selbst ändern, das Semester wechseln bzw. eine
	// neue Workspace-DB anlegen — auch wenn die aktuelle DB read-only ist.
	'/api/semester/setSemester',
	'/api/semester/setSemesterReadOnly',
	'/api/semester/createWorkspace',
	// Benutzerverwaltung ist global (OIDC-Auth), nicht semesterbezogen — der
	// Semester-Schutz darf sie nicht blockieren. Zugriff regelt das Backend (ADMIN).
	'/api/admin/setUser',
	'/api/admin/removeUser',
	// Persönliche Kontoeinstellungen (OIDC-Auth) sind global, nicht semesterbezogen
	// — der Semester-Schutz darf sie nicht blockieren. Identität regelt das Backend.
	'/api/account/setShortname',
	'/api/account/setJiraToken',
	'/api/account/removeJiraToken',
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
		return json(
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

/** @type {{ user: string | undefined; authorized: boolean; expires: number }} */
let authCache = { user: undefined, authorized: false, expires: 0 };

/**
 * Ist die aktuelle (vom Proxy gelieferte) Kennung im Backend freigeschaltet?
 * Ergebnis ~30s pro Kennung gecacht, damit nicht jeder Request ein `me` auslöst.
 *
 * Unterscheidung wichtig:
 * - Erfolgreiche Antwort mit `me.email` → freigeschaltet.
 * - Backend antwortet mit Fehler (ClientError, `.response` gesetzt) → bewusst
 *   abgelehnt (Kennung nicht in der Allowlist) → gesperrt.
 * - Netzwerk-/sonstiger Fehler (keine `.response`) → unklar, NICHT sperren
 *   (ein kurzzeitig nicht erreichbares Backend darf niemanden aussperren).
 *
 * @param {string} remoteUser
 */
async function isAuthorized(remoteUser) {
	const now = Date.now();
	if (authCache.user === remoteUser && now < authCache.expires) return authCache.authorized;
	try {
		const data = await backendRequest(gql`
			query {
				me {
					email
				}
			}
		`);
		authCache = { user: remoteUser, authorized: !!data?.me?.email, expires: now + 30000 };
	} catch (/** @type {any} */ err) {
		authCache = { user: remoteUser, authorized: !err?.response, expires: now + 30000 };
	}
	return authCache.authorized;
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

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	// Vom Auth-Proxy (nginx/Shibboleth) autoritativ injizierte Identität. Wird
	// als AsyncLocalStorage-Kontext gesetzt, damit jeder serverseitige GraphQL-
	// Call (SSR-load()s, /api-Proxys, isReadOnly unten) sie als X-Remote-User an
	// das Backend weiterreicht — siehe $lib/server/backend.
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
		// Seiten laufen dann gar nicht erst. Ohne remoteUser (lokal/Dev) greift der
		// Riegel nicht → Verhalten wie bisher.
		if (remoteUser && !(await isAuthorized(remoteUser))) {
			return denyResponse(event, remoteUser);
		}

		const { method } = event.request;
		const { pathname } = event.url;
		if (method === 'POST' && pathname.startsWith('/api/') && !READ_POST_PATHS.has(pathname)) {
			if (await isReadOnly()) {
				return json(
					{ error: 'Semester ist geschützt (nur lesen) — Schreibvorgang abgelehnt.' },
					{ status: 423 }
				);
			}
		}
		return resolve(event);
	});
}
