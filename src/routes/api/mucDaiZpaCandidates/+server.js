import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * Vorgeschlagene ZPA-Prüfungen für eine (noch) ungeklärte MUC.DAI-Prüfung.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
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
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, query, {
			program: String(program),
			primussAncode: Number(primussAncode)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
