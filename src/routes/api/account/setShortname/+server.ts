import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Eigenes Kürzel setzen (Backend OIDC-Auth). Ein leerer String setzt auf den
// ZPA-Default zurück (setMyShortname("")). Jeder darf sein eigenes Kürzel ändern —
// das Backend bezieht die Identität aus dem Token.
//
// Annahme über das Backend-Schema: setMyShortname(shortname: String!): MyAccount
// (gibt das aktualisierte Konto zurück). Die Seite lädt danach ohnehin per
// invalidateAll neu; liefert das Backend hier einen Skalar, muss die Selection weg.
export const POST: RequestHandler = async ({ request }) => {
	const { shortname } = await request.json();
	return gqlProxy(
		gql`
			mutation ($shortname: String!) {
				setMyShortname(shortname: $shortname) {
					shortname
					shortnameFromZpa
				}
			}
		`,
		{ shortname: String(shortname ?? '') }
	);
};
