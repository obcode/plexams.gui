import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// Lese-Abfrage: wie das Backend eine Adresse gerade auflösen würde.
export const POST = async ({ request }) => {
	const { email } = await request.json();
	return gqlProxy(
		gql`
			query ($email: String!) {
				accessResolveLogin(email: $email) {
					email
					role
					teachers {
						id
						fullname
					}
					actsFor
					blocked
					portalAccess
				}
			}
		`,
		{ email: String(email ?? '') }
	);
};
