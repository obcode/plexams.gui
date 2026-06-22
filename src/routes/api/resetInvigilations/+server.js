import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST() {
	const mutation = gql`
		mutation {
			resetInvigilations
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation);
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
