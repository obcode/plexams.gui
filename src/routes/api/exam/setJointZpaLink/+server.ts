import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

/**
 * Prüfung eines gemeinsamen Studiengangs (program, primussAncode) mit einem
 * ZPA-Ancode verknüpfen.
 *
 * @type {import('./$types').RequestHandler}
 */
export const POST: RequestHandler = async ({ request }) => {
	const { program, primussAncode, zpaAncode } = await request.json();
	const mutation = gql`
		mutation ($program: String!, $primussAncode: Int!, $zpaAncode: Int!) {
			setJointZpaLink(program: $program, primussAncode: $primussAncode, zpaAncode: $zpaAncode) {
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
};
