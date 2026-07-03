import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
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

	return gqlProxy(mutation, {
		zpaAncode: Number(zpaAncode),
		program,
		primussAncode: Number(primussAncode)
	});
}
