import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { input } = await request.json();

	const mutation = gql`
		mutation ($input: InvigilatorConstraintInput!) {
			setInvigilatorConstraints(input: $input) {
				teacherID
				isNotInvigilator
				excludedDates
				timeWindows {
					date
					from
					until
				}
			}
		}
	`;

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, { input });
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
