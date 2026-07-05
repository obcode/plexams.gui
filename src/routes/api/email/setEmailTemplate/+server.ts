import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Override für ein E-Mail-Template speichern. Wirft einen GraphQL-Fehler, wenn
// das Markdown nicht als Go-Template parst → gqlProxy mappt das auf HTTP 400.
export const POST: RequestHandler = async ({ request }) => {
	const { name, markdown } = await request.json();
	return gqlProxy(
		gql`
			mutation ($name: String!, $markdown: String!) {
				setEmailTemplate(name: $name, markdown: $markdown) {
					name
					markdown
					isDefault
					defaultMarkdown
					variables {
						name
						description
						example
					}
				}
			}
		`,
		{ name, markdown }
	);
};
