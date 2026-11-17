import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

// syncLog NICHT awaiten → gestreamt: die Seite (Im-/Export-Buttons) ist sofort
// da, der Verlauf füllt sich nach.
export const load: PageServerLoad = () => {
	const syncLog = backendRequest(gql`
		query {
			syncLog(limit: 100) {
				time
				operation
				label
				direction
				system
				ok
				summary
				added
				changed
				removed
				entries {
					type
					name
					fields {
						field
						old
						new
					}
				}
			}
		}
	`)
		.then((d) => d.syncLog ?? [])
		.catch(() => []);

	return { syncLog };
};
