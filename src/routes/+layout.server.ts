import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { LayoutServerLoad } from './$types';

/**
 * Lädt den Status des aktuellen Semesters serverseitig (SSR), damit jede Seite
 * `readOnly`/`compatible` ohne eigenen Client-Fetch kennt — kein Flackern beim
 * Deaktivieren der Schreib-Buttons.
 */
export const load: LayoutServerLoad = async () => {
	// Server-Infos für den Footer (GUI-/plexams.go-Version, Mongo). Eigener
	// try/catch, damit ein Backend ohne `serverInfo` den Semester-Status nicht
	// mitreißt.
	let serverInfo = null;
	try {
		const info = await request<any>(
			env.PLEXAMS_SERVER,
			gql`
				query ServerInfo {
					serverInfo {
						version
						commit
						releaseURL
						mongoHost
						mongoDatabase
					}
				}
			`
		);
		serverInfo = info?.serverInfo ?? null;
	} catch {
		// z. B. älteres Backend ohne serverInfo → Footer zeigt nur GUI-Version.
	}

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
			readOnly: !!s?.readOnly,
			serverInfo,
			guiVersion: __APP_VERSION__
		};
	} catch {
		// Backend nicht erreichbar → keine Annahme über Schutz treffen.
		return { semesterStatus: null, readOnly: false, serverInfo, guiVersion: __APP_VERSION__ };
	}
};
