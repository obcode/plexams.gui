import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { ancode1, ancode2 } = await request.json();
	const mutation = gql`
		mutation ($ancode1: Int!, $ancode2: Int!) {
			removeExamsCanShareSlot(ancode1: $ancode1, ancode2: $ancode2)
		}
	`;
	return gqlProxy(mutation, {
		ancode1: Number(ancode1),
		ancode2: Number(ancode2)
	});
}
