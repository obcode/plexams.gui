import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const kind = url.searchParams.get('kind');
	return gqlProxy(
		gql`
			query ($kind: String!) {
				emailAttachments(kind: $kind) {
					key
					filename
					size
					uploadedAt
				}
			}
		`,
		{ kind }
	);
};
