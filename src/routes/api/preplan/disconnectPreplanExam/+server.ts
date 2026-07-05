import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { id } = await request.json();

	const mutation = gql`
		mutation ($id: Int!) {
			disconnectPreplanExam(id: $id) {
				id
				ancode
			}
		}
	`;

	return gqlProxy(mutation, { id });
};
