import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Verbindungstest gegen Jira (nutzt den serverseitig hinterlegten PAT).
// Liefert `jiraConnection: null`, wenn kein/kein gültiger Token vorliegt.
export const GET: RequestHandler = async () => {
	return gqlProxy(gql`
		query {
			jiraConnection {
				name
				displayName
				emailAddress
			}
		}
	`);
};
