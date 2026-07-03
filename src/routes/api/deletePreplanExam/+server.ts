import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { id } = await request.json();

	const mutation = gql`
		mutation ($id: Int!) {
			deletePreplanExam(id: $id)
		}
	`;

	return gqlProxy(mutation, { id });
};
