import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
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
};
