import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

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
		const data = await gqlrequest(env.PLEXAMS_SERVER, document, variables);
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
