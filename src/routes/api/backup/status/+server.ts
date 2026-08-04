import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Backup-Status: hat sich seit der letzten Sicherung des Planers etwas geändert?
// Speist den Backup-Hinweis in der NavBar. lastDumpAt stempelt der Server beim
// Download von /download/my-inputs-csv.zip — siehe $lib/backup/store.js.
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
