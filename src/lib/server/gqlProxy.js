import * as Sentry from '@sentry/sveltekit';
import { json } from '@sveltejs/kit';
import { gqlErrorMessage } from '$lib/gqlError';
import { backendRequest } from '$lib/server/backend';

// Serverseitiger Helfer für die /api-Proxy-Endpunkte: führt eine GraphQL-
// Operation gegen das Backend ($PLEXAMS_SERVER) aus und verpackt das Ergebnis
// als JSON — mit einheitlichem Fehler-Handling (HTTP 400 + lesbare Meldung aus
// gqlErrorMessage). Ersetzt den in ~100 +server.js kopierten try/catch-Block.
//
//   export const POST = () => gqlProxy(gql`mutation { resetExamSchedule }`);
//
//   export async function POST({ request }) {
//     const { ancode } = await request.json();
//     return gqlProxy(gql`mutation($a: Int!){ notPlannedByMe(ancode: $a) }`,
//       { a: Number(ancode) });
//   }

/**
 * @param {import('graphql-request').RequestDocument} document Query/Mutation
 * @param {Record<string, any>} [variables]
 * @returns {Promise<Response>} JSON-Response (Daten oder `{ error }` mit 400)
 */
export async function gqlProxy(document, variables) {
	try {
		const data = await backendRequest(document, variables);
		return json(data);
	} catch (/** @type {any} */ e) {
		// Hier endeten bisher 128 der 134 /api-Routen im Fehlerfall — ohne dass
		// irgendetwas davon irgendwo auftauchte. Der Benutzer sah eine Meldung,
		// sonst niemand etwas.
		//
		// Die Unterscheidung ist dieselbe, die der Zugangs-Riegel in
		// hooks.server.js schon trifft: `.response` heißt, das Backend hat
		// geantwortet und abgelehnt — oft völlig legitim („Semester ist
		// read-only", „forbidden"), also eine Warnung. Ohne `.response` war das
		// Backend nicht erreichbar oder etwas ist unterwegs zerbrochen: das ist
		// ein Vorfall.
		Sentry.captureException(e, { level: e?.response ? 'warning' : 'error' });
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
