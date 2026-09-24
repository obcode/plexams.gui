import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { TODO_FIELDS } from '$lib/server/todoFields';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { todoId, link } = await request.json();
	return gqlProxy(
		gql`
			mutation ($todoId: Int!, $link: TodoLinkInput!) {
				addTodoLink(todoId: $todoId, link: $link) {
				${TODO_FIELDS}
			}
			}
		`,
		{ todoId, link }
	);
};
