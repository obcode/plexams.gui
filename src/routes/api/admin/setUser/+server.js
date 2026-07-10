import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// Legt einen Benutzer an bzw. aktualisiert dessen Rolle/Namen (Backend
// feat/oidc-auth). Nur ADMINs dürfen das — das Backend erzwingt es; ein
// VIEWER/PLANER erhält „forbidden".
//
// Annahme über das Backend-Schema (mangels lokal laufendem Auth-Backend):
//   setUser(email: String!, name: String!, role: Role!): User
// Falls das Backend `role` als String statt Enum führt, hier `Role!` → `String!`.
export const POST = async ({ request }) => {
	const { email, name, role } = await request.json();
	const mutation = gql`
		mutation ($email: String!, $name: String!, $role: Role!) {
			setUser(email: $email, name: $name, role: $role) {
				email
				name
				role
			}
		}
	`;
	return gqlProxy(mutation, {
		email: String(email ?? '').trim(),
		name: String(name ?? '').trim(),
		role
	});
};
