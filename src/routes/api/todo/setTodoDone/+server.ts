import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import { TODO_FIELDS } from '$lib/server/todoFields';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { id, done } = await request.json();
	return gqlProxy(
		gql`
			mutation ($id: Int!, $done: Boolean!) {
				setTodoDone(id: $id, done: $done) {
				${TODO_FIELDS}
			}
			}
		`,
		{ id, done }
	);
};
