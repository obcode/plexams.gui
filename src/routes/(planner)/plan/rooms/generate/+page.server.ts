import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';
import { GENERATION_CONFIG_FIELDS } from '$lib/semester/generationConfig';
import type { PageServerLoad } from './$types';

// Raumplanung-Generierung (analog zur Terminplan-Generierung): Gate (ROOMS in
// blockedAreas → Schreiben gesperrt, weil der Raumplan veröffentlicht ist), die
// aktuell angewandten Raumplan-Constraints (read-only) sowie die globale
// generationConfig für die Raumplanungs-Parameter (roomHeat*/room*-Gewichte).
export const load: PageServerLoad = async () => {
	try {
		const data = await backendRequest(gql`
				query {
					planningState {
						blockedAreas
					}
					roomPlanConstraints {
						name
						title
						description
						kind
						weight
						tier
					}
					generationConfig {
						${GENERATION_CONFIG_FIELDS}
					}
				}
			`);
		return {
			blockedAreas: (data.planningState?.blockedAreas ?? []) as string[],
			constraints: [...(data.roomPlanConstraints ?? [])].sort((a: any, b: any) => a.tier - b.tier),
			generationConfig: data.generationConfig ?? null,
			loadError: ''
		};
	} catch (e) {
		return {
			blockedAreas: [] as string[],
			constraints: [] as any[],
			generationConfig: null as any,
			loadError: gqlErrorMessage(e)
		};
	}
};
