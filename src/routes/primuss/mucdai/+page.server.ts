import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const data = await request<{ mucdaiExams: any[] }>(
			env.PLEXAMS_SERVER,
			gql`
				query {
					mucdaiExams {
						primussAncode
						module
						mainExamer
						mainExamerID
						examType
						duration
						isRepeaterExam
						program
						plannedBy
						ancode
						linkStatus
						planEntry {
							dayNumber
							slotNumber
							starttime
							externalTime
						}
					}
				}
			`
		);
		return { mucdaiExams: data.mucdaiExams ?? [], loadError: '' };
	} catch (e) {
		// Backend-Fehler nicht als 500 durchschlagen lassen — Seite zeigt einen Hinweis.
		return { mucdaiExams: [] as any[], loadError: gqlErrorMessage(e) };
	}
};
