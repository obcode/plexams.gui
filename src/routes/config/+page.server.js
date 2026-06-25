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
				semesterConfigInput {
					from
					fromFK07
					until
					dayNumberStart
					slots
					goDay0
					forbiddenDays
					goSlots
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
		semester: data.semester?.id ?? '',
		// null = frisches Semester ohne Config → leeres Formular
		config: data.semesterConfigInput ?? null
	};
}
