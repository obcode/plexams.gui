import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

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
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			id: Number(id),
			otherID: Number(otherID),
			conflict: !!conflict
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
