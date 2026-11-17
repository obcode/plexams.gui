import { error } from '@sveltejs/kit';
import { gql } from 'graphql-request';
import { portalRequest } from '$lib/server/backend';

/**
 * Wer bin ich im Portal? Eine Anfrage an die Portal-API – nie an die
 * Planungs-API, die eine reine Portal-Kennung gar nicht erreicht.
 *
 * @type {import('./$types').LayoutServerLoad}
 */
export async function load({ setHeaders }) {
	// Portal-Seiten zeigen persönliche Angaben; auf einem geteilten Rechner soll
	// der Zurück-Knopf nach dem Abmelden nichts aus dem Cache holen.
	setHeaders({ 'cache-control': 'no-store' });
	try {
		const data = await portalRequest(gql`
			query {
				session {
					email
					name
					isStaff
					teachers {
						id
						fullname
						shortname
					}
					actsFor {
						id
						fullname
					}
				}
			}
		`);
		return { session: data.session };
	} catch (/** @type {any} */ e) {
		const status = e?.response?.status;
		if (status === 404) error(404, 'Das Portal ist noch nicht freigeschaltet.');
		if (status === 403) error(403, 'Kein Zutritt zum Portal.');
		error(503, 'Das Portal ist gerade nicht erreichbar.');
	}
}
