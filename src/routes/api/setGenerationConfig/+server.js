import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { input } = await request.json();
	const mutation = gql`
		mutation ($input: GenerationConfigInput!) {
			setGenerationConfig(input: $input) {
				timelagMin
			}
		}
	`;
	return gqlProxy(mutation, { input });
}
