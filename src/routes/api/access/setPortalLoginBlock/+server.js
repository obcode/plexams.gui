import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';

// Sperrt den Portalzugang einer Kennung; eine Planungsrolle bleibt unberührt.
export const POST = async ({ request }) => {
	const { email, reason } = await request.json();
	return gqlProxy(
		gql`
			mutation ($email: String!, $reason: String) {
				setPortalLoginBlock(email: $email, reason: $reason) {
					email
				}
			}
		`,
		{ email: String(email ?? ''), reason: reason ?? '' }
	);
};
