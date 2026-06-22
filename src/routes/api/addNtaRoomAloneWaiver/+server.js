import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { mtknr, ancode, reason } = await request.json();

	const mutation = gql`
		mutation ($mtknr: String!, $ancode: Int!, $reason: String!) {
			addNtaRoomAloneWaiver(mtknr: $mtknr, ancode: $ancode, reason: $reason) {
				mtknr
				ancode
				reason
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { mtknr, ancode, reason });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
