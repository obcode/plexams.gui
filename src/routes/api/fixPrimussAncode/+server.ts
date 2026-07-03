import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { CONNECTED_EXAM_FIELDS } from '$lib/exam/connectedFields.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
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

	return gqlProxy(mutation, {
		zpaAncode: Number(zpaAncode),
		program,
		fromAncode: Number(fromAncode),
		toAncode: Number(toAncode)
	});
};
