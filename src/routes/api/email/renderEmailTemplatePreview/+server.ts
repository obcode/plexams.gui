import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Live-Vorschau: rendert (auch ungespeichertes) Markdown gegen Beispieldaten.
// Reine Lese-Abfrage → in hooks.server.js READ_POST_PATHS freigeschaltet, damit
// die Vorschau auch im geschützten (read-only) Semester funktioniert.
export const POST: RequestHandler = async ({ request }) => {
	const { name, markdown } = await request.json();
	return gqlProxy(
		gql`
			query ($name: String!, $markdown: String!) {
				renderEmailTemplatePreview(name: $name, markdown: $markdown) {
					html
					text
					error
				}
			}
		`,
		{ name, markdown }
	);
};
