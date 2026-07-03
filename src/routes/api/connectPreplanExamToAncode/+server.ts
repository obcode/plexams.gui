import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { id, ancode } = await request.json();

	const mutation = gql`
		mutation ($id: Int!, $ancode: Int!) {
			connectPreplanExamToAncode(id: $id, ancode: $ancode) {
				id
				ancode
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { id, ancode });
		return json(data);
	} catch (e) {
		// unbekannter Ancode oder schon von anderer PreplanExam belegt
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
};
