import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Eigenes Jira-PAT (Personal Access Token) hinterlegen (Backend OIDC-Auth). Das
// Token ist write-only: es wird verschlüsselt gespeichert und nie wieder im
// Klartext ausgeliefert — die Seite zeigt nur den Status (jiraTokenSet/-UpdatedAt).
//
// Annahme über das Backend-Schema: setMyJiraToken(token: String!): MyAccount.
// Fehler (z. B. „secrets.key fehlt") reicht gqlProxy als lesbare Meldung durch.
export const POST: RequestHandler = async ({ request }) => {
	const { token } = await request.json();
	return gqlProxy(
		gql`
			mutation ($token: String!) {
				setMyJiraToken(token: $token) {
					jiraTokenSet
					jiraTokenUpdatedAt
				}
			}
		`,
		{ token: String(token ?? '') }
	);
};
