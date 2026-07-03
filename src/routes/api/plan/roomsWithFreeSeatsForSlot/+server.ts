import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { day, time } = await request.json();

	const query = gql`
		query ($day: Int!, $time: Int!) {
			roomsWithFreeSeatsForSlot(day: $day, time: $time) {
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

	return gqlProxy(query, { day, time });
};
