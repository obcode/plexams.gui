import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, starttime } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $starttime: Time!) {
			unblockRoomAt(room: $room, starttime: $starttime)
		}
	`;

	return gqlProxy(mutation, { room, starttime });
};
