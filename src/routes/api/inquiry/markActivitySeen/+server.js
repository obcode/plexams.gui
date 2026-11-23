import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';

// Die Änderungsübersicht bis zu einer Änderung als gelesen markieren. Persönlich und
// global, nicht semesterbezogen (READ_POST_PATHS).
export const POST = async ({ request }) => {
	const { upTo } = await request.json();
	return gqlProxy(
		gql`
			mutation ($upTo: Int!) {
				markInquiryActivitySeen(upTo: $upTo)
			}
		`,
		{ upTo: Number(upTo) }
	);
};
