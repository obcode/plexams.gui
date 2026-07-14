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
