import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { name, email, testMail, cc, noreplyMail, noreplyName } = await request.json();

	// name/email sind Pflicht; die vier Overrides sind optional — leer (null) lässt
	// das Backend auf den abgeleiteten Default zurückfallen.
	const mutation = gql`
		mutation (
			$name: String!
			$email: String!
			$testMail: String
			$cc: String
			$noreplyMail: String
			$noreplyName: String
		) {
			setPlaner(
				name: $name
				email: $email
				testMail: $testMail
				cc: $cc
				noreplyMail: $noreplyMail
				noreplyName: $noreplyName
			) {
				name
				email
				testMail
				cc
				noreplyMail
				noreplyName
			}
		}
	`;

	return gqlProxy(mutation, {
		name,
		email,
		testMail: testMail || null,
		cc: cc || null,
		noreplyMail: noreplyMail || null,
		noreplyName: noreplyName || null
	});
};
