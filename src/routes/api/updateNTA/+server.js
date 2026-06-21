import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { input } = await request.json();

	const mutation = gql`
		mutation ($input: NTAInput!) {
			updateNTA(input: $input) {
				mtknr
				name
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { input });
		return json(data);
	} catch (e) {
		// u. a. wenn die mtknr nicht gefunden wird
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
