import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

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

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, query, { day, time });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
