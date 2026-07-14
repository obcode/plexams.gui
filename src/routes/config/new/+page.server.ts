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
				mucDaiAllowedTimes
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
		}
	`);

	return {
		currentSemester: data.semester?.id ?? '',
		// vorbefüllte Vorlage aus dem aktuellen Semester
		defaults: data.newSemesterConfigDefaults ?? null
	};
};
