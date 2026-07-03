import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { room, slots } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $slots: [SlotInput!]!) {
			unblockRoomForSlots(room: $room, slots: $slots)
		}
	`;

	return gqlProxy(mutation, { room, slots });
}
