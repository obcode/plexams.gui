import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { force } = await request.json();

	const mutation = gql`
		mutation ($force: Boolean!) {
			applyRoomRequestsPreview(force: $force)
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { force: !!force });
		return json(data);
	} catch (e) {
		// u. a. „… already exist" wenn force=false und bereits Anfragen existieren
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
