import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';

// Abfrage des aktiven Semesters schließen.
export const POST = async ({ request }) => {
	const { kind } = await request.json();
	return gqlProxy(
		gql`
			mutation ($kind: InquiryKind!) {
				closeInquiry(kind: $kind) {
					kind
					state
				}
			}
		`,
		{ kind: String(kind) }
	);
};
