import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Status-Übergang ausführen (transitionId aus jiraTransitions). Liefert Boolean.
export const POST: RequestHandler = async ({ request }) => {
	const { key, transitionId } = await request.json();
	return gqlProxy(
		gql`
			mutation ($key: String!, $transitionId: String!) {
				transitionJiraIssue(key: $key, transitionId: $transitionId)
			}
		`,
		{ key: String(key ?? ''), transitionId: String(transitionId ?? '') }
	);
};
