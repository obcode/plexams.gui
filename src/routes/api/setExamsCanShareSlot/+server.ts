import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { ancode1, ancode2 } = await request.json();
	const mutation = gql`
		mutation ($ancode1: Int!, $ancode2: Int!) {
			setExamsCanShareSlot(ancode1: $ancode1, ancode2: $ancode2)
		}
	`;
	return gqlProxy(mutation, {
		ancode1: Number(ancode1),
		ancode2: Number(ancode2)
	});
};
