import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';

export const POST = async ({ request }) => {
	const { email } = await request.json();
	return gqlProxy(
		gql`
			mutation ($email: String!) {
				removePortalLoginBlock(email: $email)
			}
		`,
		{ email: String(email ?? '') }
	);
};
