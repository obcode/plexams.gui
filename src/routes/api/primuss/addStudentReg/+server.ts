import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Fügt eine einzelne Primuss-Anmeldung (mtknr) zu einer Prüfung hinzu.
// Datenverändernd → im Read-only-Semester geblockt (hooks.server.js).
export const POST: RequestHandler = async ({ request }) => {
	const { program, ancode, mtknr } = await request.json();

	const mutation = gql`
		mutation ($program: String!, $ancode: Int!, $mtknr: String!) {
			addStudentReg(program: $program, ancode: $ancode, mtknr: $mtknr)
		}
	`;

	return gqlProxy(mutation, { program, ancode: Number(ancode), mtknr });
};
