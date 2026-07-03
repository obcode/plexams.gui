import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, day, slot, active } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $day: Int!, $slot: Int!, $active: Boolean!) {
			setRoomRequestActive(room: $room, day: $day, slot: $slot, active: $active) {
				room
				active
			}
		}
	`;

	return gqlProxy(mutation, { room, day, slot, active });
};
