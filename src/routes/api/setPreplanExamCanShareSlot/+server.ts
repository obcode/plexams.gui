import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

/**
 * „Darf zusammen mit" einer Preplan-Prüfung setzen/entfernen.
 * canShare = true → erlauben, false → entfernen. Symmetrisch.
 *
 * @type {import('./$types').RequestHandler}
 */
export const POST: RequestHandler = async ({ request }) => {
	const { id, otherID, canShare } = await request.json();
	const mutation = gql`
		mutation ($id: Int!, $otherID: Int!, $canShare: Boolean!) {
			setPreplanExamCanShareSlot(id: $id, otherID: $otherID, canShare: $canShare) {
				id
				canShareSlot
			}
		}
	`;
	return gqlProxy(mutation, {
		id: Number(id),
		otherID: Number(otherID),
		canShare: !!canShare
	});
};
