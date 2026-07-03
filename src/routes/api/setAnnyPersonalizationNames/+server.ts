import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

/**
 * Personalisierungs-Namen setzen (Mehrfachnamen). Wirkt sofort auf `mine` der
 * Anny-Buchungen (wird beim Query berechnet).
 *
 * @type {import('./$types').RequestHandler}
 */
export const POST: RequestHandler = async ({ request }) => {
	const { names } = await request.json();
	const mutation = gql`
		mutation ($names: [String!]!) {
			setAnnyPersonalizationNames(names: $names) {
				personalizationNames
			}
		}
	`;
	const clean = Array.isArray(names)
		? names.map((/** @type {unknown} */ n) => String(n).trim()).filter(Boolean)
		: [];
	return gqlProxy(mutation, { names: clean });
};
