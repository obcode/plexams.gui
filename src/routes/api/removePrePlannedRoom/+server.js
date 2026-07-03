import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { ancode, roomName, mtknr } = await request.json();

	const mutation = gql`
		mutation ($ancode: Int!, $roomName: String!, $mtknr: String) {
			removePrePlannedRoom(ancode: $ancode, roomName: $roomName, mtknr: $mtknr)
		}
	`;

	return gqlProxy(mutation, { ancode, roomName, mtknr });
}
