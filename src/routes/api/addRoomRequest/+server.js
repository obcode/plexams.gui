import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { room, day, slot, from, until } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $day: Int!, $slot: Int!, $from: Time!, $until: Time!) {
			addRoomRequest(room: $room, day: $day, slot: $slot, from: $from, until: $until) {
				room
				day
				slot
				from
				until
				approved
				active
			}
		}
	`;

	return gqlProxy(mutation, { room, day, slot, from, until });
}
