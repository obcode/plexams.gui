import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/**
 * Personalisierungs-Namen setzen (Mehrfachnamen). Wirkt sofort auf `mine` der
 * Anny-Buchungen (wird beim Query berechnet).
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
	const { names } = await request.json();
	const mutation = gql`
		mutation ($names: [String!]!) {
			setAnnyPersonalizationNames(names: $names) {
				personalizationNames
			}
		}
	`;
	try {
		const clean = Array.isArray(names)
			? names.map((/** @type {unknown} */ n) => String(n).trim()).filter(Boolean)
			: [];
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { names: clean });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
