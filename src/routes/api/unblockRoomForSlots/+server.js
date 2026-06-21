import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { room, slots } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $slots: [SlotInput!]!) {
			unblockRoomForSlots(room: $room, slots: $slots)
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { room, slots });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
