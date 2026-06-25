import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { CONNECTED_EXAM_FIELDS } from '$lib/exam/connectedFields.js';

export async function load() {
	const query = gql`
		query {
			connectedExams {
				${CONNECTED_EXAM_FIELDS}
			}
		}
	`;

	try {
		const data = await request(env.PLEXAMS_SERVER, query);
		return { connectedExams: data.connectedExams ?? [], loadError: null };
	} catch (e) {
		// z. B. wenn das Backend einen ungültigen Eintrag liefert — lieber eine
		// Meldung zeigen als die ganze Seite mit 500 abstürzen lassen.
		return {
			connectedExams: null,
			loadError: e instanceof Error ? e.message : String(e)
		};
	}
}
