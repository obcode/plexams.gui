import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

type StudyProgram = { shortname: string; active: boolean; retired: boolean };

// Studiengänge für die Programm-Auswahl (ICS-Kalender + Entwurf-CSV).
export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
		query {
			studyPrograms {
				shortname
				active
				retired
			}
		}
	`);

	const programs = (data.studyPrograms ?? [])
		.filter((p) => p.active && !p.retired)
		.map((p) => p.shortname)
		.sort((a, b) => a.localeCompare(b));

	return { programs };
};
