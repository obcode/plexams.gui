import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// Eine Meldung als gesichtet markieren oder ablehnen (mit Begründung).
export const POST = async ({ request }) => {
	const { id, revision, state, note } = await request.json();
	return gqlProxy(
		gql`
			mutation ($id: Int!, $revision: Int!, $state: InquiryReviewState!, $note: String) {
				reviewInquirySubmission(id: $id, revision: $revision, state: $state, note: $note)
			}
		`,
		{ id: Number(id), revision: Number(revision), state: String(state), note: note ?? null }
	);
};
