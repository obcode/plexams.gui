import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

// syncLog NICHT awaiten → gestreamt: die Seite (Im-/Export-Buttons) ist sofort
// da, der Verlauf füllt sich nach.
export function load() {
	const syncLog = request(
		env.PLEXAMS_SERVER,
		gql`
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
		`
	)
		.then((/** @type {any} */ d) => d.syncLog ?? [])
		.catch(() => []);

	return { syncLog };
}
