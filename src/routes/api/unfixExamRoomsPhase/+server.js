import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// Fixierung der EXaHM/SEB-Raumphase aufheben (manuelles Locked bleibt unangetastet).
/** @type {import('./$types').RequestHandler} */
export async function POST() {
	const mutation = gql`
		mutation {
			unfixExamRoomsPhase
		}
	`;
	return gqlProxy(mutation);
}
