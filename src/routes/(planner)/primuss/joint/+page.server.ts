import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const data = await backendRequest<{
			jointExams: any[];
			semesterConfig: any;
			studyPrograms: { shortname: string; jointFaculty: string | null }[];
		}>(gql`
			query {
				semesterConfig {
					days {
						date
					}
					starttimes {
						start
					}
				}
				studyPrograms {
					shortname
					jointFaculty
				}
				jointExams {
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
						starttime
						external
					}
				}
			}
		`);
		// Studienfakultät je gemeinsamem Studiengang (JointExam trägt selbst keine):
		// JointExam.program → StudyProgram.jointFaculty.
		const facultyByProgram: Record<string, string> = {};
		for (const p of data.studyPrograms ?? [])
			if (p.jointFaculty) facultyByProgram[p.shortname] = p.jointFaculty;
		return {
			jointExams: data.jointExams ?? [],
			semesterConfig: data.semesterConfig ?? null,
			facultyByProgram,
			loadError: ''
		};
	} catch (e) {
		// Backend-Fehler nicht als 500 durchschlagen lassen — Seite zeigt einen Hinweis.
		return {
			jointExams: [] as any[],
			semesterConfig: null,
			facultyByProgram: {} as Record<string, string>,
			loadError: gqlErrorMessage(e)
		};
	}
};
