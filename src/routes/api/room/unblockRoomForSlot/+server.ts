import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, day, slot } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $day: Int!, $slot: Int!) {
			unblockRoomForSlot(room: $room, day: $day, slot: $slot)
		}
	`;

	return gqlProxy(mutation, { room, day, slot });
};
