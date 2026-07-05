import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { input } = await request.json();
	// Validierungsfehler (ungültiges Datum/Slot-Format, …) → 400
	return gqlProxy(
		gql`
			mutation ($input: SemesterConfigInputData!) {
				setSemesterConfigInput(input: $input) {
					ok
					warnings
				}
			}
		`,
		{ input }
	);
};
