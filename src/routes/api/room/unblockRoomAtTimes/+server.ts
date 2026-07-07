import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, starttimes } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $starttimes: [Time!]!) {
			unblockRoomAtTimes(room: $room, starttimes: $starttimes)
		}
	`;

	return gqlProxy(mutation, { room, starttimes });
};
