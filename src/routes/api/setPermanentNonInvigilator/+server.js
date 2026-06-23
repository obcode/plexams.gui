import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { teacherID, reason } = await request.json();

	const mutation = gql`
		mutation ($teacherID: Int!, $reason: String!) {
			setPermanentNonInvigilator(teacherID: $teacherID, reason: $reason) {
				teacherID
				reason
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { teacherID, reason });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
