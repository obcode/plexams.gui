import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { TODO_COMMENT_FIELDS } from '$lib/server/todoFields';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { todoId, body } = await request.json();
	return gqlProxy(
		gql`
			mutation ($todoId: Int!, $body: String!) {
				addTodoComment(todoId: $todoId, body: $body) {
				${TODO_COMMENT_FIELDS}
			}
			}
		`,
		{ todoId, body }
	);
};
