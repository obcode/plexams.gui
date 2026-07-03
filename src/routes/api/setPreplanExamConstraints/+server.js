import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

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
	return gqlProxy(mutation, { id: Number(id), constraints });
}
