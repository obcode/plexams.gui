import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { keepAssigned } = await request.json();

	const mutation = gql`
		mutation ($keepAssigned: Boolean!) {
			generatePreplanAssignment(keepAssigned: $keepAssigned) {
				ok
				assignedCount
				unassignedIDs
				messages
			}
		}
	`;

	return gqlProxy(mutation, {
		keepAssigned: Boolean(keepAssigned)
	});
}
