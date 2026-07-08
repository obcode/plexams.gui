import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Kommentar an ein Issue anhängen. Liefert Boolean (Erfolg).
export const POST: RequestHandler = async ({ request }) => {
	const { key, body } = await request.json();
	return gqlProxy(
		gql`
			mutation ($key: String!, $body: String!) {
				addJiraComment(key: $key, body: $body)
			}
		`,
		{ key: String(key ?? ''), body: String(body ?? '') }
	);
};
