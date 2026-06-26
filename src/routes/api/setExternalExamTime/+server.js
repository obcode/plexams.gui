import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { ancode, date, time } = await request.json();
	const mutation = gql`
		mutation ($ancode: Int!, $date: String!, $time: String!) {
			setExternalExamTime(ancode: $ancode, date: $date, time: $time)
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			ancode: Number(ancode),
			date: String(date),
			time: String(time)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
