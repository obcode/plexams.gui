import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { csv } = await request.json();
	const mutation = gql`
		mutation ($csv: String!) {
			importMucDaiExams(csv: $csv) {
				programs
				examsImported
				examsCreated
				examsExisting
				examsSkippedFK07
			}
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { csv: String(csv ?? '') });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
