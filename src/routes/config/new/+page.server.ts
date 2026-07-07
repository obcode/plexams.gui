import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await request<any>(
		env.PLEXAMS_SERVER,
		gql`
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
		`
	);

	return {
		currentSemester: data.semester?.id ?? '',
		// vorbefüllte Vorlage aus dem aktuellen Semester
		defaults: data.newSemesterConfigDefaults ?? null
	};
};
