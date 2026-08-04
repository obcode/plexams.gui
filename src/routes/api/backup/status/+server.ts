import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Backup-/Dump-Status: hat sich seit dem letzten Semester-Dump etwas geändert?
// Speist den Backup-Hinweis in der NavBar. lastDumpAt stempelte der Server beim
// Download des Semester-Dumps; der ist mit der MongoDB-Schicht entfallen und
// kommt als pg_dump zurück — siehe $lib/backup/store.js.
export const GET: RequestHandler = () =>
	gqlProxy(gql`
		query {
			backupStatus {
				hasUnsavedChanges
				lastDumpAt
				lastChangeAt
			}
		}
	`);
