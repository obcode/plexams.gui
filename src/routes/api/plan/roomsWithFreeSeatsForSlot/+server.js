import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
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
}
