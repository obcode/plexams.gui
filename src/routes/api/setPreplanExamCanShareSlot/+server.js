import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * „Darf zusammen mit" einer Preplan-Prüfung setzen/entfernen.
 * canShare = true → erlauben, false → entfernen. Symmetrisch.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	const { id, otherID, canShare } = await request.json();
	const mutation = gql`
		mutation ($id: Int!, $otherID: Int!, $canShare: Boolean!) {
			setPreplanExamCanShareSlot(id: $id, otherID: $otherID, canShare: $canShare) {
				id
				canShareSlot
			}
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			id: Number(id),
			otherID: Number(otherID),
			canShare: !!canShare
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
