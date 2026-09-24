import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { TODO_FIELDS } from '$lib/server/todoFields';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { filter } = await request.json();
	return gqlProxy(
		gql`
			query ($filter: TodoFilter) {
				todos(filter: $filter) {
				${TODO_FIELDS}
			}
			}
		`,
		{ filter }
	);
};
