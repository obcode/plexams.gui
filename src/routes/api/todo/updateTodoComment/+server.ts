import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { TODO_COMMENT_FIELDS } from '$lib/server/todoFields';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { id, body } = await request.json();
	return gqlProxy(
		gql`
			mutation ($id: Int!, $body: String!) {
				updateTodoComment(id: $id, body: $body) {
				${TODO_COMMENT_FIELDS}
			}
			}
		`,
		{ id, body }
	);
};
