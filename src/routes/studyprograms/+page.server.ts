import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

type StudyProgram = {
	shortname: string;
	name: string;
	degree: string;
	category: string;
	active: boolean;
	retired: boolean;
	externalExamsBase: number;
};

export const load: PageServerLoad = async () => {
	const data = await request<{ studyPrograms: StudyProgram[] }>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				studyPrograms {
					shortname
					name
					degree
					category
					active
					retired
					externalExamsBase
				}
			}
		`
	);

	const programs = (data.studyPrograms ?? [])
		.slice()
		.sort((a, b) => a.shortname.localeCompare(b.shortname));

	return { programs };
};
