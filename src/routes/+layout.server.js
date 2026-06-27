import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

/**
 * Lädt den Status des aktuellen Semesters serverseitig (SSR), damit jede Seite
 * `readOnly`/`compatible` ohne eigenen Client-Fetch kennt — kein Flackern beim
 * Deaktivieren der Schreib-Buttons.
 *
 * @type {import('./$types').LayoutServerLoad}
 */
export async function load() {
	try {
		const data = await request(
			env.PLEXAMS_SERVER,
			gql`
				query {
					semester {
						id
						semester
						compatible
						readOnly
					}
				}
			`
		);
		const s = data?.semester ?? null;
		return {
			semesterStatus: s,
			readOnly: !!s?.readOnly
		};
	} catch {
		// Backend nicht erreichbar → keine Annahme über Schutz treffen.
		return { semesterStatus: null, readOnly: false };
	}
}
