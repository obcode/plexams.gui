import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { ancode1, ancode2, mtknr } = await request.json();
	const mutation = gql`
		mutation ($ancode1: Int, $ancode2: Int, $mtknr: String) {
			removeStudentConflictDecision(ancode1: $ancode1, ancode2: $ancode2, mtknr: $mtknr)
		}
	`;
	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, {
			ancode1: Number(ancode1),
			ancode2: Number(ancode2),
			mtknr: String(mtknr)
		});
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
