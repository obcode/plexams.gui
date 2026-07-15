import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { teacherID, name, reason, validFrom, validUntil } = await request.json();

	const mutation = gql`
		mutation (
			$teacherID: Int!
			$name: String!
			$reason: String!
			$validFrom: String
			$validUntil: String
		) {
			setPermanentNonInvigilator(
				teacherID: $teacherID
				name: $name
				reason: $reason
				validFrom: $validFrom
				validUntil: $validUntil
			) {
				teacherID
				name
				reason
				validFrom
				validUntil
			}
		}
	`;

	return gqlProxy(mutation, {
		teacherID,
		name,
		reason,
		validFrom: validFrom || null,
		validUntil: validUntil || null
	});
};
