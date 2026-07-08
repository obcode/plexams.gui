import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	const query = gql`
		query {
			validatePreplanAssignment {
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

	return gqlProxy(query);
};
