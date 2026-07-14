import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
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
		const info = await backendRequest(gql`
			query ServerInfo {
				serverInfo {
					version
					commit
					releaseURL
					mongoHost
					mongoDatabase
				}
			}
		`);
		serverInfo = info?.serverInfo ?? null;
	} catch {
		// z. B. älteres Backend ohne serverInfo → Footer zeigt nur GUI-Version.
	}

	// Angemeldete Identität + Rolle (Backend feat/oidc-auth). Eigener try/catch,
	// damit ein Backend ohne `me` (z. B. lokal/Dev) den Semester-Status nicht
	// mitreißt → me bleibt null = voller Zugriff, es wird nichts ausgeblendet.
	let me = null;
	try {
		const info = await backendRequest(gql`
			query Me {
				me {
					email
					name
					role
				}
			}
		`);
		me = info?.me ?? null;
	} catch {
		// Älteres Backend ohne Auth → keine Rolle, GUI verhält sich wie bisher.
	}

	try {
		const data = await backendRequest(gql`
			query {
				semester {
					id
					semester
					compatible
					readOnly
				}
			}
		`);
		const s = data?.semester ?? null;
		return {
			semesterStatus: s,
			readOnly: !!s?.readOnly,
			me,
			serverInfo,
			guiVersion: __APP_VERSION__
		};
	} catch {
		// Backend nicht erreichbar → keine Annahme über Schutz treffen.
		return { semesterStatus: null, readOnly: false, me, serverInfo, guiVersion: __APP_VERSION__ };
	}
};
