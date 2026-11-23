import { gql } from 'graphql-request';
import { backendRequest } from '#lib/server/backend.js';
import { gqlErrorMessage } from '#lib/gqlError.js';
import type { PageServerLoad } from './$types';

// „Mein Account" — eigene Identität + persönliche Einstellungen (Kürzel, Jira-PAT).
// Die `myAccount`-Query gibt es nur auf einem Backend mit OIDC-Auth; lokal/Dev
// bzw. ein älteres Backend liefert einen Fehler → freundliche Meldung, statt die
// Seite zu killen. `email`/`name`/`role` kommen read-only aus dem IdP.
export const load: PageServerLoad = async () => {
	try {
		const data = await backendRequest<{ myAccount: any }>(gql`
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
		// Benachrichtigung über Eingaben im Portal; ein älteres Backend kennt sie nicht.
		let notificationMode: string | null = null;
		try {
			const n = await backendRequest<{ myNotificationSetting: { mode: string } }>(gql`
				query {
					myNotificationSetting {
						mode
					}
				}
			`);
			notificationMode = n.myNotificationSetting?.mode ?? null;
		} catch {
			notificationMode = null;
		}
		return {
			account: data.myAccount ?? null,
			available: !!data.myAccount,
			loadError: '',
			notificationMode
		};
	} catch (e) {
		return {
			account: null,
			available: false,
			loadError: gqlErrorMessage(e),
			notificationMode: null as string | null
		};
	}
};
