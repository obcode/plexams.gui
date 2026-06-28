import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * Slot einer Preplan-Prüfung fixieren/lösen. Fixieren geht nur, wenn ein Slot
 * gesetzt ist (Backend wirft sonst einen Fehler).
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	const { id, fixed } = await request.json();
	const mutation = gql`
		mutation ($id: Int!, $fixed: Boolean!) {
			setPreplanExamFixed(id: $id, fixed: $fixed) {
				id
				isFixed
			}
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { id: Number(id), fixed: !!fixed });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
