import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { ancode, date, time } = await request.json();
	const mutation = gql`
		mutation ($ancode: Int!, $date: String!, $time: String!) {
			setExternalExamTime(ancode: $ancode, date: $date, time: $time)
		}
	`;
	return gqlProxy(mutation, {
		ancode: Number(ancode),
		date: String(date),
		time: String(time)
	});
}
