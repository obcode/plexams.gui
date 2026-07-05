import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

/**
 * Manuelle Verknüpfung einer MUC.DAI-Prüfung entfernen (fällt auf die
 * automatische Erkennung zurück).
 *
 * @type {import('./$types').RequestHandler}
 */
export const POST: RequestHandler = async ({ request }) => {
	const { program, primussAncode } = await request.json();
	const mutation = gql`
		mutation ($program: String!, $primussAncode: Int!) {
			removeMucDaiLink(program: $program, primussAncode: $primussAncode) {
				program
				primussAncode
				ancode
				linkStatus
			}
		}
	`;
	return gqlProxy(mutation, {
		program: String(program),
		primussAncode: Number(primussAncode)
	});
};
