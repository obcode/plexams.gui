import { error } from '@sveltejs/kit';
import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { TODO_COMMENT_FIELDS, TODO_FIELDS } from '$lib/server/todoFields';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const data = await backendRequest<{ todo: any }>(
		gql`
			query ($id: Int!) {
				todo(id: $id) {
					${TODO_FIELDS}
					comments {
						${TODO_COMMENT_FIELDS}
					}
				}
			}
		`,
		{ id: Number(params.id) }
	);
	if (!data.todo) error(404, `Todo ${params.id} gibt es in diesem Semester nicht.`);
	return { todo: data.todo };
};
