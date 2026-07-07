import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, starttimes, reason } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $starttimes: [Time!]!, $reason: String) {
			blockRoomAtTimes(room: $room, starttimes: $starttimes, reason: $reason) {
				room
				starttime
				reason
			}
		}
	`;

	return gqlProxy(mutation, { room, starttimes, reason });
};
