import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { kind, query } = await request.json();
	return gqlProxy(
		gql`
			query ($kind: TodoLinkKind!, $query: String!) {
				todoLinkSuggestions(kind: $kind, query: $query) {
					kind
					key
					label
					href
				}
			}
		`,
		{ kind, query }
	);
};
