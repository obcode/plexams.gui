import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const mutation = gql`
		mutation ($day: Int!, $time: Int!, $examGroupCode: Int!) {
			addExamGroupToSlot(day: $day, time: $time, examGroupCode: $examGroupCode)
		}
	`;

	const { examGroupCode, slot } = await request.json();

	const variables = {
		examGroupCode,
		day: slot.dayNumber,
		time: slot.slotNumber
	};

	const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, variables);

	return json(data);
}
