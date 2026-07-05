import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Override entfernen → der eingebaute Default wird wieder wirksam.
// Boolean: true, wenn ein Override entfernt wurde.
export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();
	return gqlProxy(
		gql`
			mutation ($name: String!) {
				resetEmailTemplate(name: $name)
			}
		`,
		{ name }
	);
};
