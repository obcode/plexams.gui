import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { ancode, duration } = await request.json();
	const mutation = gql`
		mutation ($ancode: Int!, $duration: Int!) {
			setExamDuration(ancode: $ancode, duration: $duration) {
				ancode
				duration
			}
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			ancode: Number(ancode),
			duration: Number(duration)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
