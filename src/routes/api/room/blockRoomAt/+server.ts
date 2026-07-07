import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, starttime, reason } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $starttime: Time!, $reason: String) {
			blockRoomAt(room: $room, starttime: $starttime, reason: $reason) {
				room
				starttime
				reason
			}
		}
	`;

	return gqlProxy(mutation, { room, starttime, reason });
};
