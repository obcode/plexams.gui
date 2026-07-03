import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { ancode, roomName, mtknr } = await request.json();

	const mutation = gql`
		mutation ($ancode: Int!, $roomName: String!, $mtknr: String) {
			removePrePlannedRoom(ancode: $ancode, roomName: $roomName, mtknr: $mtknr)
		}
	`;

	return gqlProxy(mutation, { ancode, roomName, mtknr });
};
