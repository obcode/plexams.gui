import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * Administration / Überblick (Backend: adminOverview). Die Query ist
 * ADMIN-geschützt — der Resolver wirft `forbidden` für Nicht-Admins bzw. ein
 * Backend ohne diese Query schlägt fehl. Wir fangen das ab und zeigen einen
 * freundlichen Hinweis; die eigentliche Zugriffskontrolle macht das Backend.
 *
 * @type {import('./$types').PageServerLoad}
 */
export const load = async () => {
	try {
		const data = await backendRequest(gql`
			query AdminOverview {
				adminOverview {
					generatedAt
					server {
						version
						commit
						mongoHost
						mongoDatabase
						releaseURL
					}
					activeSemester
					workspaces {
						id
						semester
						readOnly
						schemaVersion
					}
					users {
						email
						name
						role
						shortname
					}
					roleCounts {
						admin
						planer
						viewer
						total
					}
					scheduler {
						autoSyncEnabled
						autoSyncTime
						neverRan
						lastFireAt
						lastFinished
						lastStatus
						lastTrigger
						lastSemester
						lastTotalChanges
						adminMailEnabled
						adminMailTime
					}
					backup {
						hasUnsavedChanges
						lastDumpAt
						lastChangeAt
					}
					live {
						writesAllowed
						readOnly
					}
					activity {
						last24h
						last7d
						errors7d
						distinctUsers7d
						topOperations {
							name
							count
						}
					}
					recentActivity {
						time
						name
						type
						user
						error
						durationMs
					}
					recentErrors {
						time
						name
						user
						error
					}
					recentSyncs {
						time
						system
						label
						summary
						ok
					}
				}
			}
		`);
		return {
			overview: /** @type {any} */ (data).adminOverview ?? null,
			available: true,
			loadError: ''
		};
	} catch (e) {
		return { overview: null, available: false, loadError: gqlErrorMessage(e) };
	}
};
