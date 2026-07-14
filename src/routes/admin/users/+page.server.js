import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * Benutzerverwaltung (Backend feat/oidc-auth). Die `users`-Query ist
 * ADMIN-geschützt — für Nicht-Admins bzw. ein Backend ohne Auth schlägt sie fehl.
 * Wir fangen das ab und zeigen eine freundliche Meldung; die eigentliche
 * Zugriffskontrolle macht das Backend.
 *
 * @type {import('./$types').PageServerLoad}
 */
export const load = async () => {
	try {
		const data = await backendRequest(gql`
			query {
				users {
					email
					name
					role
				}
				me {
					email
					name
					role
				}
			}
		`);
		const users = /** @type {any} */ (data.users ?? [])
			.slice()
			.sort((/** @type {any} */ a, /** @type {any} */ b) =>
				(a.name || a.email).localeCompare(b.name || b.email)
			);
		return { users, me: /** @type {any} */ (data).me ?? null, available: true, loadError: '' };
	} catch (e) {
		return { users: [], me: null, available: false, loadError: gqlErrorMessage(e) };
	}
};
