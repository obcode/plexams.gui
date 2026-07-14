import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Backup-/Dump-Status: hat sich seit dem letzten Semester-Dump etwas geändert?
// Speist den Backup-Hinweis in der NavBar. lastDumpAt wird vom Server beim
// Download von /download/semester-dump.zip gestempelt.
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
