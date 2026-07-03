import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

/**
 * Slot einer Preplan-Prüfung fixieren/lösen. Fixieren geht nur, wenn ein Slot
 * gesetzt ist (Backend wirft sonst einen Fehler).
 *
 * @type {import('./$types').RequestHandler}
 */
export const POST: RequestHandler = async ({ request }) => {
	const { id, fixed } = await request.json();
	const mutation = gql`
		mutation ($id: Int!, $fixed: Boolean!) {
			setPreplanExamFixed(id: $id, fixed: $fixed) {
				id
				isFixed
			}
		}
	`;
	return gqlProxy(mutation, { id: Number(id), fixed: !!fixed });
};
