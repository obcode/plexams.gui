import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

/**
 * Vorgeschlagene ZPA-Prüfungen für eine (noch) ungeklärte MUC.DAI-Prüfung.
 *
 * @type {import('./$types').RequestHandler}
 */
export const POST: RequestHandler = async ({ request }) => {
	const { program, primussAncode } = await request.json();
	const query = gql`
		query ($program: String!, $primussAncode: Int!) {
			mucDaiZpaCandidates(program: $program, primussAncode: $primussAncode) {
				ancode
				module
				mainExamer
				examTypeFull
				duration
			}
		}
	`;
	return gqlProxy(query, {
		program: String(program),
		primussAncode: Number(primussAncode)
	});
};
