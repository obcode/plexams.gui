import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { keepAssigned } = await request.json();

	const query = gql`
		query ($keepAssigned: Boolean!) {
			preplanBookingSuggestions(keepAssigned: $keepAssigned) {
				unplacedNow
				stillUnplacedIDs
				suggestions {
					room
					from
					until
					seats
					starttimes
					modules
					kinds
				}
				newlyPlaced {
					id
					module
					examKind
					expectedStudents
					starttime
				}
				findings {
					level
					message
				}
			}
		}
	`;

	return gqlProxy(query, { keepAssigned: keepAssigned !== false });
};
