import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import { CONNECTED_EXAM_FIELDS } from '$lib/exam/connectedFields.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { zpaAncode, program, primussAncode } = await request.json();

	const mutation = gql`
		mutation ($zpaAncode: Int!, $program: String!, $primussAncode: Int!) {
			addPrimussAncode(zpaAncode: $zpaAncode, program: $program, primussAncode: $primussAncode) {
				${CONNECTED_EXAM_FIELDS}
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			zpaAncode: Number(zpaAncode),
			program,
			primussAncode: Number(primussAncode)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
