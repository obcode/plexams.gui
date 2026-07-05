import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { CONNECTED_EXAM_FIELDS } from '$lib/exam/connectedFields.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { zpaAncode, program } = await request.json();

	const mutation = gql`
		mutation ($zpaAncode: Int!, $program: String!) {
			removePrimussAncode(zpaAncode: $zpaAncode, program: $program) {
				${CONNECTED_EXAM_FIELDS}
			}
		}
	`;

	return gqlProxy(mutation, {
		zpaAncode: Number(zpaAncode),
		program
	});
};
