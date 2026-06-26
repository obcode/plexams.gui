import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
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
		`
	);
	const teachers = (data.teachers ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.fullname.localeCompare(b.fullname));
	return {
		exams: data.additionalExams ?? [],
		rooms: (data.rooms ?? []).map((/** @type {any} */ r) => r.name),
		teachers
	};
}
