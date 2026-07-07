import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, starttime, from, until } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $starttime: Time!, $from: Time!, $until: Time!) {
			addRoomRequest(room: $room, starttime: $starttime, from: $from, until: $until) {
				room
				starttime
				from
				until
				approved
				active
			}
		}
	`;

	return gqlProxy(mutation, { room, starttime, from, until });
};
