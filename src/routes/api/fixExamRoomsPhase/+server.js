import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// EXaHM/SEB-Raumphase fixieren (überlebt Phase B). Gibt die Anzahl fixierter
// Prüfungen zurück.
/** @type {import('./$types').RequestHandler} */
export async function POST() {
	const mutation = gql`
		mutation {
			fixExamRoomsPhase
		}
	`;
	return gqlProxy(mutation);
}
