import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
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
};
