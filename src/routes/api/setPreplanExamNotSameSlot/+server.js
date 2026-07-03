import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/**
 * Konfliktpartner („nicht gleichzeitig") einer Preplan-Prüfung setzen/entfernen.
 * conflict = true → hinzufügen, false → entfernen. Symmetrisch (wirkt auf beide).
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	const { id, otherID, conflict } = await request.json();
	const mutation = gql`
		mutation ($id: Int!, $otherID: Int!, $conflict: Boolean!) {
			setPreplanExamNotSameSlot(id: $id, otherID: $otherID, conflict: $conflict) {
				id
				notSameSlot
			}
		}
	`;
	return gqlProxy(mutation, {
		id: Number(id),
		otherID: Number(otherID),
		conflict: !!conflict
	});
}
