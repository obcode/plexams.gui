import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { LayoutServerLoad } from './$types';

/**
 * Lädt den Status des aktuellen Semesters serverseitig (SSR), damit jede Seite
 * `readOnly`/`compatible` ohne eigenen Client-Fetch kennt — kein Flackern beim
 * Deaktivieren der Schreib-Buttons.
 */
export const load: LayoutServerLoad = async () => {
	try {
		const data = await request<any>(
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
};
