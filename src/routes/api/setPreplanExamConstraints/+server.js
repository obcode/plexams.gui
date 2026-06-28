import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * Constraints einer Preplan-Prüfung setzen. `constraints` ist ein (flacher)
 * ConstraintsInput. sameSlot enthält Preplan-IDs (nicht Ancodes).
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	const { id, constraints } = await request.json();
	const mutation = gql`
		mutation ($id: Int!, $constraints: ConstraintsInput!) {
			setPreplanExamConstraints(id: $id, constraints: $constraints) {
				id
			}
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { id: Number(id), constraints });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
