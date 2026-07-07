import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { starttime } = await request.json();

	const query = gql`
		query ($starttime: Time!) {
			roomsWithFreeSeatsAt(starttime: $starttime) {
				roomName
				seats
				usedSeats
				freeSeats
				handicap
				exahm
				lab
				seb
				usedBy {
					ancode
					module
					examer
					studentCount
				}
			}
		}
	`;

	return gqlProxy(query, { starttime });
};
