import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Neues Issue anlegen. project/issueType sind optional — ohne sie greift der
// Backend-Default (jira.project bzw. „Task"). Gibt das erzeugte Issue zurück.
export const POST: RequestHandler = async ({ request }) => {
	const { project, issueType, summary, description } = await request.json();
	return gqlProxy(
		gql`
			mutation ($project: String, $issueType: String, $summary: String!, $description: String) {
				createJiraIssue(
					project: $project
					issueType: $issueType
					summary: $summary
					description: $description
				) {
					key
					summary
					description
					status
					issueType
					url
				}
			}
		`,
		{
			project: project ? String(project) : null,
			issueType: issueType ? String(issueType) : null,
			summary: String(summary ?? ''),
			description: description ? String(description) : null
		}
	);
};
