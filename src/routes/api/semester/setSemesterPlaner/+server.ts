import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { name, email, testMail, cc, noreplyMail, noreplyName } = await request.json();

	// Setzt den Planer des AKTUELLEN Semesters. Name und E-Mail gehören zusammen:
	// beide gesetzt = eigener Planer, beide leer (null) = der Default aus der
	// Serverkonfiguration gilt; nur eines von beiden lehnt das Backend ab. Die vier
	// Overrides sind einzeln optional — leer (null) lässt das Backend auf smtp.* und
	// dann auf den abgeleiteten Default zurückfallen.
	const mutation = gql`
		mutation (
			$name: String
			$email: String
			$testMail: String
			$cc: String
			$noreplyMail: String
			$noreplyName: String
		) {
			setSemesterPlaner(
				name: $name
				email: $email
				testMail: $testMail
				cc: $cc
				noreplyMail: $noreplyMail
				noreplyName: $noreplyName
			) {
				name
				email
				inherited
				testMail
				cc
				noreplyMail
				noreplyName
			}
		}
	`;

	return gqlProxy(mutation, {
		name: name || null,
		email: email || null,
		testMail: testMail || null,
		cc: cc || null,
		noreplyMail: noreplyMail || null,
		noreplyName: noreplyName || null
	});
};
