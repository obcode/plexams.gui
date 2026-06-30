import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * Manuelle Verknüpfung einer MUC.DAI-Prüfung entfernen (fällt auf die
 * automatische Erkennung zurück).
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
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
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			program: String(program),
			primussAncode: Number(primussAncode)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
