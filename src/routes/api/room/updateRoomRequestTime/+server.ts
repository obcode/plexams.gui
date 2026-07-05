import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, day, slot, from, until } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $day: Int!, $slot: Int!, $from: Time!, $until: Time!) {
			updateRoomRequestTime(room: $room, day: $day, slot: $slot, from: $from, until: $until) {
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
};
