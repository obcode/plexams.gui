import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { kind } = await request.json();

	const mutation = gql`
		mutation ($kind: String!) {
			clearEmailAttachments(kind: $kind)
		}
	`;

	const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { kind });

	return json(data);
};
