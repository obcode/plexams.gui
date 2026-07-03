import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { room, day, slot } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $day: Int!, $slot: Int!) {
			unblockRoomForSlot(room: $room, day: $day, slot: $slot)
		}
	`;

	return gqlProxy(mutation, { room, day, slot });
}
