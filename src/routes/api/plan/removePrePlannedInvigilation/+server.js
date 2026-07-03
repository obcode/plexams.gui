import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { day, slot, roomName } = await request.json();

	const mutation = gql`
		mutation ($day: Int!, $slot: Int!, $roomName: String) {
			removePrePlannedInvigilation(day: $day, slot: $slot, roomName: $roomName)
		}
	`;

	return gqlProxy(mutation, { day, slot, roomName });
}
