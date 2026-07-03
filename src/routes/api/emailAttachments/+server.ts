import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const kind = url.searchParams.get('kind');

	const query = gql`
		query ($kind: String!) {
			emailAttachments(kind: $kind) {
				key
				filename
				size
				uploadedAt
			}
		}
	`;

	const data = await gqlrequest(env.PLEXAMS_SERVER, query, { kind });

	return json(data);
};
