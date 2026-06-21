import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { room, day, slot, from, until } = await request.json();

	const mutation = gql`
		mutation ($room: String!, $day: Int!, $slot: Int!, $from: Time!, $until: Time!) {
			updateRoomRequestTime(room: $room, day: $day, slot: $slot, from: $from, until: $until) {
				room
				day
				slot
				from
				until
				approved
				active
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { room, day, slot, from, until });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
