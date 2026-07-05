import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Fixierung der EXaHM/SEB-Raumphase aufheben (manuelles Locked bleibt unangetastet).
export const POST: RequestHandler = async () => {
	const mutation = gql`
		mutation {
			unfixExamRoomsPhase
		}
	`;
	return gqlProxy(mutation);
};
