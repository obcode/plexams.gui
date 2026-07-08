import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import type { PageServerLoad } from './$types';

// Verbindungsstatus für das Badge schon serverseitig laden (kein Flackern).
// Ein PAT-/Netzwerkfehler darf die Seite nicht killen → als connectionError
// weiterreichen; die interaktiven Teile arbeiten danach client-seitig.
export const load: PageServerLoad = async () => {
	try {
		const data = await request<{ jiraConnection: any }>(
			env.PLEXAMS_SERVER,
			gql`
				query {
					jiraConnection {
						name
						displayName
						emailAddress
					}
				}
			`
		);
		return { connection: data.jiraConnection ?? null, connectionError: '' };
	} catch (e) {
		return { connection: null, connectionError: gqlErrorMessage(e) };
	}
};
