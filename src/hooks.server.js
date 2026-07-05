import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { json } from '@sveltejs/kit';

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
	// reine Lese-Abfragen:
	'/api/exam/conflictingAncodes',
	'/api/plan/roomsWithFreeSeatsForSlot',
	'/api/slot/awkwardSlots',
	'/api/plan/roomNamesInSlot',
	'/api/slot/allowedSlots',
	'/api/preplan/validatePreplanAssignment',
	'/api/primuss/students',
	'/api/plan/slotWithNTAs',
	'/api/slot/preExamsInSlot',
	'/api/slot/examsInSlot',
	'/api/plan/roomsForSlot',
	'/api/plan/roomsWithInvigilationsForSlot',
	'/api/plan/invigilatorsForDay',
	'/api/plan/plannedRoomForStudent',
	'/api/plan/examsInSlot',
	'/api/preplan/preplanExamAncodeSuggestions'
]);

/** @type {{ value: boolean; expires: number }} */
let roCache = { value: false, expires: 0 };

/** read-only-Status des aktuellen Semesters, ~5s gecacht (1 Klick = 1 Mutation). */
async function isReadOnly() {
	const now = Date.now();
	if (now < roCache.expires) return roCache.value;
	try {
		const data = await request(
			env.PLEXAMS_SERVER,
			gql`
				query {
					semester {
						readOnly
					}
				}
			`
		);
		roCache = { value: !!data?.semester?.readOnly, expires: now + 5000 };
	} catch {
		// Im Zweifel nicht blockieren — das Backend bleibt der eigentliche Riegel.
		roCache = { value: false, expires: now + 5000 };
	}
	return roCache.value;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const { method, url } = { method: event.request.method, url: event.url };
	if (method === 'POST' && url.pathname.startsWith('/api/') && !READ_POST_PATHS.has(url.pathname)) {
		if (await isReadOnly()) {
			return json(
				{ error: 'Semester ist geschützt (nur lesen) — Schreibvorgang abgelehnt.' },
				{ status: 423 }
			);
		}
	}
	return resolve(event);
}
