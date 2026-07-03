import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { ancode } = await request.json();
	const mutation = gql`
		mutation ($ancode: Int!) {
			removeExamDuration(ancode: $ancode)
		}
	`;
	return gqlProxy(mutation, { ancode: Number(ancode) });
}
