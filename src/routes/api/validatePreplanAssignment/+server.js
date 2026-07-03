import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST() {
	const query = gql`
		query {
			validatePreplanAssignment {
				ok
				assignedCount
				unassignedIDs
				messages
			}
		}
	`;

	return gqlProxy(query);
}
