import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { ancode, roomName, mtknr } = await request.json();

	const mutation = gql`
		mutation ($ancode: Int!, $roomName: String!, $mtknr: String) {
			removePrePlannedRoom(ancode: $ancode, roomName: $roomName, mtknr: $mtknr)
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { ancode, roomName, mtknr });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
