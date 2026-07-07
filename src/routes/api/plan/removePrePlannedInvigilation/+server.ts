import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { starttime, roomName } = await request.json();

	const mutation = gql`
		mutation ($starttime: Time!, $roomName: String) {
			removePrePlannedInvigilation(starttime: $starttime, roomName: $roomName)
		}
	`;

	return gqlProxy(mutation, { starttime, roomName });
};
