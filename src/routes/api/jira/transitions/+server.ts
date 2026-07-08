import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Verfügbare Status-Übergänge eines Issues (?key=PROJ-123). Die ids gehen
// anschließend an transitionJiraIssue.
export const GET: RequestHandler = async ({ url }) => {
	const key = url.searchParams.get('key') ?? '';
	return gqlProxy(
		gql`
			query ($key: String!) {
				jiraTransitions(key: $key) {
					id
					name
				}
			}
		`,
		{ key }
	);
};
