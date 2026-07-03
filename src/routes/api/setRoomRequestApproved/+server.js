import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { room, day, slot, approved } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $day: Int!, $slot: Int!, $approved: Boolean!) {
			setRoomRequestApproved(room: $room, day: $day, slot: $slot, approved: $approved) {
				room
				approved
			}
		}
	`;

	return gqlProxy(mutation, { room, day, slot, approved });
}
