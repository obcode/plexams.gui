import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { room, day, slot, reason } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $day: Int!, $slot: Int!, $reason: String) {
			blockRoomForSlot(room: $room, day: $day, slot: $slot, reason: $reason) {
				room
				day
				slot
				reason
			}
		}
	`;

	return gqlProxy(mutation, { room, day, slot, reason });
}
