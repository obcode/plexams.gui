import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { day, slot, roomName } = await request.json();

	const mutation = gql`
		mutation ($day: Int!, $slot: Int!, $roomName: String) {
			prePlanInvigilationInSlot(day: $day, slot: $slot, roomName: $roomName)
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { day, slot, roomName });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
