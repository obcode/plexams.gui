import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Verwirft den eigenen Planer des aktuellen Semesters — danach gilt wieder der
// Default aus der Serverkonfiguration.
export const POST: RequestHandler = async () => {
	const mutation = gql`
		mutation {
			resetSemesterPlaner {
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

	return gqlProxy(mutation, {});
};
