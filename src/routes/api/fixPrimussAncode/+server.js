import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import { CONNECTED_EXAM_FIELDS } from '$lib/exam/connectedFields.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { zpaAncode, program, fromAncode, toAncode } = await request.json();

	const mutation = gql`
		mutation ($zpaAncode: Int!, $program: String!, $fromAncode: Int!, $toAncode: Int!) {
			fixPrimussAncode(
				zpaAncode: $zpaAncode
				program: $program
				fromAncode: $fromAncode
				toAncode: $toAncode
			) {
				${CONNECTED_EXAM_FIELDS}
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			zpaAncode: Number(zpaAncode),
			program,
			fromAncode: Number(fromAncode),
			toAncode: Number(toAncode)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
