import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Hinterlegtes Jira-PAT wieder entfernen (Backend OIDC-Auth).
//
// Annahme über das Backend-Schema: removeMyJiraToken: MyAccount (gibt das
// aktualisierte Konto zurück). Die Seite lädt danach per invalidateAll neu.
export const POST: RequestHandler = async () => {
	return gqlProxy(gql`
		mutation {
			removeMyJiraToken {
				jiraTokenSet
				jiraTokenUpdatedAt
			}
		}
	`);
};
