import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import type { PageServerLoad } from './$types';

// Phase A (EXaHM/SEB in den T-Bau planen + fixieren). Gate wie Phase B: steht
// EXAMS in blockedAreas (Entwurf/Plan veröffentlicht), sind die schreibenden
// Aktionen gesperrt, der Probelauf bleibt erlaubt.
export const load: PageServerLoad = async () => {
	try {
		const data = await request<any>(
			env.PLEXAMS_SERVER,
			gql`
				query {
					planningState {
						blockedAreas
					}
				}
			`
		);
		return { blockedAreas: data.planningState?.blockedAreas ?? [], loadError: '' };
	} catch (e) {
		return { blockedAreas: [] as string[], loadError: gqlErrorMessage(e) };
	}
};
