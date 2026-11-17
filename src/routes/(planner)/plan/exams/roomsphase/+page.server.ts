import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';
import { GENERATION_CONFIG_FIELDS } from '$lib/semester/generationConfig';
import type { PageServerLoad } from './$types';

// Phase A (EXaHM/SEB in den T-Bau planen + fixieren). Gate wie Phase B: steht
// EXAMS in blockedAreas (Entwurf/Plan veröffentlicht), sind die schreibenden
// Aktionen gesperrt, der Probelauf bleibt erlaubt. generationConfig für die
// T-Bau-Gewichtung (Phase-A-Parameter examTbauFill).
export const load: PageServerLoad = async () => {
	try {
		const data = await backendRequest(gql`
				query {
					planningState {
						blockedAreas
					}
					generationConfig {
						${GENERATION_CONFIG_FIELDS}
					}
					examRoomsPhaseState {
						planned
						fixed
						allFixed
					}
				}
			`);
		return {
			blockedAreas: data.planningState?.blockedAreas ?? [],
			generationConfig: data.generationConfig ?? null,
			examRoomsPhaseState: data.examRoomsPhaseState ?? null,
			loadError: ''
		};
	} catch (e) {
		return {
			blockedAreas: [] as string[],
			generationConfig: null as any,
			examRoomsPhaseState: null as any,
			loadError: gqlErrorMessage(e)
		};
	}
};
