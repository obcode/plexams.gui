import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// Entfernt einen Benutzer (Backend feat/oidc-auth). Nur ADMINs; das Backend
// erzwingt es.
//
// Annahme über das Backend-Schema: removeUser(email: String!): Boolean
// (skalares Ergebnis, daher keine Feldauswahl). Liefert das Backend hier einen
// Objekttyp, muss eine Selection ergänzt werden.
export const POST = async ({ request }) => {
	const { email } = await request.json();
	const mutation = gql`
		mutation ($email: String!) {
			removeUser(email: $email)
		}
	`;
	return gqlProxy(mutation, { email: String(email ?? '').trim() });
};
