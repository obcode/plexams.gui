import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { keepAssigned } = await request.json();

	const mutation = gql`
		mutation ($keepAssigned: Boolean!) {
			generatePreplanAssignment(keepAssigned: $keepAssigned) {
				ok
				skipped
				skipReason
				assignedCount
				unassignedIDs
				messages
				findings {
					level
					message
				}
			}
		}
	`;

	return gqlProxy(mutation, {
		keepAssigned: Boolean(keepAssigned)
	});
};
