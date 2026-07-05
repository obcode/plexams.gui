import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// EXaHM/SEB-Raumphase fixieren (überlebt Phase B). Gibt die Anzahl fixierter
// Prüfungen zurück.
export const POST: RequestHandler = async () => {
	const mutation = gql`
		mutation {
			fixExamRoomsPhase
		}
	`;
	return gqlProxy(mutation);
};
