import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, starttime, approved } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $starttime: Time!, $approved: Boolean!) {
			setRoomRequestApproved(room: $room, starttime: $starttime, approved: $approved) {
				room
				approved
			}
		}
	`;

	return gqlProxy(mutation, { room, starttime, approved });
};
