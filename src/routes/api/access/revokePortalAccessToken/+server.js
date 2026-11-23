import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';

export const POST = async ({ request }) => {
	const { id } = await request.json();
	return gqlProxy(
		gql`
			mutation ($id: String!) {
				revokePortalAccessToken(id: $id)
			}
		`,
		{ id: String(id ?? '') }
	);
};
