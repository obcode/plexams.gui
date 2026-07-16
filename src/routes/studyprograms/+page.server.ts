import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

type StudyProgram = {
	shortname: string;
	name: string;
	degree: string;
	category: string;
	active: boolean;
	retired: boolean;
	externalExamsBase: number;
	jointFaculty: string | null;
};

export const load: PageServerLoad = async () => {
	const data = await backendRequest<{ studyPrograms: StudyProgram[] }>(gql`
		query {
			studyPrograms {
				shortname
				name
				degree
				category
				active
				retired
				externalExamsBase
				jointFaculty
			}
		}
	`);

	const programs = (data.studyPrograms ?? [])
		.slice()
		.sort((a, b) => a.shortname.localeCompare(b.shortname));

	return { programs };
};
