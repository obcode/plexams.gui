import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Ein einzelnes Issue nachschlagen (?key=PROJ-123). `jiraIssue` ist null,
// wenn der Key nicht existiert (oder nicht sichtbar ist).
export const GET: RequestHandler = async ({ url }) => {
	const key = url.searchParams.get('key') ?? '';
	return gqlProxy(
		gql`
			query ($key: String!) {
				jiraIssue(key: $key) {
					key
					summary
					description
					status
					issueType
					url
				}
			}
		`,
		{ key }
	);
};
