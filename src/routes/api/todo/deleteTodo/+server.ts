import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { id } = await request.json();
	return gqlProxy(
		gql`
			mutation ($id: Int!) {
				deleteTodo(id: $id)
			}
		`,
		{ id }
	);
};
