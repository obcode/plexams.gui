import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { kind } = await request.json();

	const mutation = gql`
		mutation ($kind: String!) {
			clearEmailAttachments(kind: $kind)
		}
	`;

	const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { kind });

	return json(data);
}
