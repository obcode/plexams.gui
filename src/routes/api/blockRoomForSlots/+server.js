import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { room, slots, reason } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $slots: [SlotInput!]!, $reason: String) {
			blockRoomForSlots(room: $room, slots: $slots, reason: $reason) {
				room
				day
				slot
				reason
			}
		}
	`;

	return gqlProxy(mutation, { room, slots, reason });
}
