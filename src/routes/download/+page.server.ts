import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

type StudyProgram = { shortname: string; active: boolean; retired: boolean };

// Studiengänge für die Programm-Auswahl (ICS-Kalender + Entwurf-CSV).
export const load: PageServerLoad = async () => {
	const data = await request<{ studyPrograms: StudyProgram[] }>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				studyPrograms {
					shortname
					active
					retired
				}
			}
		`
	);

	const programs = (data.studyPrograms ?? [])
		.filter((p) => p.active && !p.retired)
		.map((p) => p.shortname)
		.sort((a, b) => a.localeCompare(b));

	return { programs };
};
