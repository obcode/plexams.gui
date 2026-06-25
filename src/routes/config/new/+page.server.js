import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				semester {
					id
				}
				newSemesterConfigDefaults {
					from
					until
					slots
					forbiddenDays
					mucDaiSlots
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
}
