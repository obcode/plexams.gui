import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { TODO_FIELDS } from '$lib/server/todoFields';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { input } = await request.json();
	return gqlProxy(
		gql`
			mutation ($input: TodoInput!) {
				createTodo(input: $input) {
				${TODO_FIELDS}
			}
			}
		`,
		{ input }
	);
};
