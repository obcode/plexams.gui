import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const mutation = gql`
		mutation ($anCode: Int!, $unknown: Boolean!) {
			addZpaExamToPlan(anCode: $anCode, unknown: $unknown)
		}
	`;

	const { anCode, unknown } = await request.json();

	const variables = {
		anCode,
		unknown
	};

	const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, variables);

	return json(data);
}