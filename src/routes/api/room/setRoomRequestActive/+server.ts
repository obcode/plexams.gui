import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { room, starttime, active } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $starttime: Time!, $active: Boolean!) {
			setRoomRequestActive(room: $room, starttime: $starttime, active: $active) {
				room
				active
			}
		}
	`;

	return gqlProxy(mutation, { room, starttime, active });
};
