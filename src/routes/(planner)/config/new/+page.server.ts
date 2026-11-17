import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
		query {
			semester {
				id
			}
			newSemesterConfigDefaults {
				from
				until
				startTimes
				forbiddenDays
				jointProgramAllowedTimes {
					program
					allowedTimes
				}
				timelagMin
				notTooCloseMinutes
				crossCampusGapMinutes
				maxSeatsPerSlot
				emails {
					profs
					lbas
					lbasLastSemester
					additionalExamer
					fs
					sekr
					roomManagement
					kdp
					lbaba
				}
			}
			studyPrograms {
				shortname
				name
				category
				jointFaculty
			}
		}
	`);

	// Kandidaten für den Pro-Studiengang-Zeiten-Editor: Studiengänge mit category=joint.
	const jointPrograms = (data.studyPrograms ?? [])
		.filter((p: any) => p.category === 'joint')
		.map((p: any) => ({ shortname: p.shortname, name: p.name, jointFaculty: p.jointFaculty }))
		.sort((a: any, b: any) => a.shortname.localeCompare(b.shortname));

	return {
		currentSemester: data.semester?.id ?? '',
		// vorbefüllte Vorlage aus dem aktuellen Semester
		defaults: data.newSemesterConfigDefaults ?? null,
		// gemeinsame Studiengänge (Kandidaten für den Zeiten-Editor)
		jointPrograms
	};
};
