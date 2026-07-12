import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Fixierungs-Stand der EXaHM/SEB-Raumphase (Phase A). Client-seitig aufgerufen,
// um die Statusanzeige nach fix/unfix/Phase-A-Generieren zu aktualisieren und
// vor Phase B (Terminplan generieren) vor unfixierten Prüfungen zu warnen.
export const GET: RequestHandler = async () => {
	const query = gql`
		query {
			examRoomsPhaseState {
				planned
				fixed
				allFixed
			}
		}
	`;
	return gqlProxy(query);
};
