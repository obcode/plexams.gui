import { fail } from '@sveltejs/kit';
import { gql } from 'graphql-request';
import { portalRequest } from '$lib/server/backend';
import { portalErrorMessage } from '$lib/portal/errors';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const data = await portalRequest(gql`
		query {
			accessTokens {
				id
				description
				scope
				createdAt
				expiresAt
				lastUsedAt
				revokedAt
			}
		}
	`);
	return { tokens: data.accessTokens };
}

/** @type {import('./$types').Actions} */
export const actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const description = String(form.get('description') ?? '').trim();
		const scope = form.get('scope') === 'WRITE' ? 'WRITE' : 'READ';
		const days = Number(form.get('expiresInDays') ?? 90);
		try {
			const data = await portalRequest(
				gql`
					mutation ($d: String!, $s: TokenScope!, $e: Int) {
						createAccessToken(description: $d, scope: $s, expiresInDays: $e) {
							secret
							token {
								id
							}
						}
					}
				`,
				{ d: description, s: scope, e: days }
			);
			// Das Geheimnis geht genau einmal an die Seite zurück und wird nirgends
			// gespeichert.
			return { created: { secret: data.createAccessToken.secret, description } };
		} catch (e) {
			return fail(400, { error: portalErrorMessage(e), description, scope, days });
		}
	},
	revoke: async ({ request }) => {
		const form = await request.formData();
		try {
			await portalRequest(
				gql`
					mutation ($id: String!) {
						revokeAccessToken(id: $id)
					}
				`,
				{ id: String(form.get('id') ?? '') }
			);
			return { revoked: true };
		} catch (e) {
			return fail(400, { error: portalErrorMessage(e) });
		}
	}
};
