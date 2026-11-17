import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * Zugang zum Portal für Prüfende. Alle Abfragen sind ADMIN-geschützt; für andere
 * Rollen schlägt der Load fehl und die Seite zeigt eine Meldung.
 *
 * @type {import('./$types').PageServerLoad}
 */
export const load = async () => {
	try {
		const data = await backendRequest(gql`
			query {
				accessIdentityReport {
					kind
					teacherID
					teacherName
					email
					hasExams
				}
				loginAliases {
					email
					teacherID
					teacherName
					note
					createdBy
					createdAt
				}
				portalLoginBlocks {
					email
					reason
					createdBy
					createdAt
				}
				rejectedLogins {
					email
					at
					count
				}
				portalAccessTokens {
					id
					ownerEmail
					description
					scope
					expiresAt
					lastUsedAt
					revokedAt
				}
			}
		`);
		return { ...data, available: true, loadError: '' };
	} catch (e) {
		return {
			accessIdentityReport: [],
			loginAliases: [],
			portalLoginBlocks: [],
			rejectedLogins: [],
			portalAccessTokens: [],
			available: false,
			loadError: gqlErrorMessage(e)
		};
	}
};
