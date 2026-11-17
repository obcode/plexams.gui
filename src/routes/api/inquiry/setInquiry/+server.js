import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// Abfrage des aktiven Semesters anlegen oder ändern (Frist, Einleitung).
export const POST = async ({ request }) => {
	const { kind, deadline, intro } = await request.json();
	return gqlProxy(
		gql`
			mutation ($kind: InquiryKind!, $input: InquiryInput!) {
				setInquiry(kind: $kind, input: $input) {
					kind
					state
				}
			}
		`,
		{ kind: String(kind), input: { deadline: deadline || null, intro: String(intro ?? '') } }
	);
};
