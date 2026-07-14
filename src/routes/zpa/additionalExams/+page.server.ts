import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
		query {
			additionalExams {
				ancode
				date
				time
				rooms {
					roomName
					invigilatorID
					duration
					isReserve
					studentCount
					isHandicap
				}
			}
			rooms {
				name
			}
			teachers(fromZPA: false) {
				id
				fullname
			}
		}
	`);
	const teachers = (data.teachers ?? [])
		.slice()
		.sort((a: any, b: any) => a.fullname.localeCompare(b.fullname));
	return {
		exams: data.additionalExams ?? [],
		rooms: (data.rooms ?? []).map((r: any) => r.name),
		teachers
	};
};
