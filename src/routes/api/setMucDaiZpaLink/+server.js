import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

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
	return gqlProxy(mutation, {
		program: String(program),
		primussAncode: Number(primussAncode),
		zpaAncode: Number(zpaAncode)
	});
}
