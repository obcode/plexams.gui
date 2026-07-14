import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';
import type { PageServerLoad } from './$types';

// „Mein Account" — eigene Identität + persönliche Einstellungen (Kürzel, Jira-PAT).
// Die `myAccount`-Query gibt es nur auf einem Backend mit OIDC-Auth; lokal/Dev
// bzw. ein älteres Backend liefert einen Fehler → freundliche Meldung, statt die
// Seite zu killen. `email`/`name`/`role` kommen read-only aus dem IdP.
export const load: PageServerLoad = async () => {
	try {
		const data = await backendRequest(gql`
			query {
				myAccount {
					email
					name
					role
					shortname
					shortnameFromZpa
					jiraTokenSet
					jiraTokenUpdatedAt
				}
			}
		`);
		return { account: data.myAccount ?? null, available: !!data.myAccount, loadError: '' };
	} catch (e) {
		return { account: null, available: false, loadError: gqlErrorMessage(e) };
	}
};
