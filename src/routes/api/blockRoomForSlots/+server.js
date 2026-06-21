import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { room, slots, reason } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $slots: [SlotInput!]!, $reason: String) {
			blockRoomForSlots(room: $room, slots: $slots, reason: $reason) {
				room
				day
				slot
				reason
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { room, slots, reason });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
