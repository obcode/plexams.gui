import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';

// Die aktuelle Fassung einer EXaHM/SEB-Meldung erneut in die Vorplanung schreiben.
export const POST = async ({ request }) => {
	const { id } = await request.json();
	return gqlProxy(
		gql`
			mutation ($id: Int!) {
				reapplyInquirySubmission(id: $id)
			}
		`,
		{ id: Number(id) }
	);
};
