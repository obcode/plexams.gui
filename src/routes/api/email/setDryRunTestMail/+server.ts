import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Probelauf-Empfänger für diese Session überschreiben. Leerer String setzt zurück.
export const POST: RequestHandler = async ({ request }) => {
	const { email } = await request.json();
	return gqlProxy(
		gql`
			mutation ($email: String!) {
				setDryRunTestMail(email: $email) {
					override
					current
					default
					overridden
				}
			}
		`,
		{ email: email ?? '' }
	);
};
