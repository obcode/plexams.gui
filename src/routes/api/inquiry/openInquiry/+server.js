import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// Abfrage des aktiven Semesters öffnen.
export const POST = async ({ request }) => {
	const { kind } = await request.json();
	return gqlProxy(
		gql`
			mutation ($kind: InquiryKind!) {
				openInquiry(kind: $kind) {
					kind
					state
				}
			}
		`,
		{ kind: String(kind) }
	);
};
