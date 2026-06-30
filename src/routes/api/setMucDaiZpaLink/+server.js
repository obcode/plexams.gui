import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * MUC.DAI-Prüfung (program, primussAncode) mit einem ZPA-Ancode verknüpfen.
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	const { program, primussAncode, zpaAncode } = await request.json();
	const mutation = gql`
		mutation ($program: String!, $primussAncode: Int!, $zpaAncode: Int!) {
			setMucDaiZpaLink(program: $program, primussAncode: $primussAncode, zpaAncode: $zpaAncode) {
				program
				primussAncode
				ancode
				linkStatus
			}
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			program: String(program),
			primussAncode: Number(primussAncode),
			zpaAncode: Number(zpaAncode)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
