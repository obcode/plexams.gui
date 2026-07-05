import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { kind } = await request.json();
	return gqlProxy(
		gql`
			mutation ($kind: String!) {
				clearEmailAttachments(kind: $kind)
			}
		`,
		{ kind }
	);
};
