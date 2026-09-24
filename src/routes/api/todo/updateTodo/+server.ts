import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { TODO_FIELDS } from '$lib/server/todoFields';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { id, input } = await request.json();
	return gqlProxy(
		gql`
			mutation ($id: Int!, $input: TodoInput!) {
				updateTodo(id: $id, input: $input) {
				${TODO_FIELDS}
			}
			}
		`,
		{ id, input }
	);
};
