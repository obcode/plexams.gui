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
				planer {
					name
					email
				}
				semesterConfigInput {
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
		semester: data.semester?.id ?? '',
		// global (semesterübergreifend) in der DB
		planer: data.planer ?? { name: '', email: '' },
		// null = frisches Semester ohne Config → leeres Formular
		config: data.semesterConfigInput ?? null
	};
};
