import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Entfernt eine einzelne Primuss-Anmeldung (mtknr) aus einer Prüfung.
// Liefert die Anzahl entfernter Registrierungen. Datenverändernd → im
// Read-only-Semester geblockt (hooks.server.js).
export const POST: RequestHandler = async ({ request }) => {
	const { program, ancode, mtknr } = await request.json();

	const mutation = gql`
		mutation ($program: String!, $ancode: Int!, $mtknr: String!) {
			removeStudentReg(program: $program, ancode: $ancode, mtknr: $mtknr)
		}
	`;

	return gqlProxy(mutation, { program, ancode: Number(ancode), mtknr });
};
