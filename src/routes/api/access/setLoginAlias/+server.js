import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// Login-Alias für das Portal: eine SSO-Adresse, die von der ZPA-Adresse der
// Person abweicht. Nur ADMIN; das Backend erzwingt es.
export const POST = async ({ request }) => {
	const { email, teacherID, note } = await request.json();
	return gqlProxy(
		gql`
			mutation ($email: String!, $teacherID: Int!, $note: String) {
				setLoginAlias(email: $email, teacherID: $teacherID, note: $note) {
					email
					teacherID
				}
			}
		`,
		{ email: String(email ?? ''), teacherID: Number(teacherID), note: note ?? '' }
	);
};
