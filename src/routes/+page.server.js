import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const semesterQuery = gql`
		query {
			semester {
				id
			}
		}
	`;

	const semesterData = await request(env.PLEXAMS_SERVER, semesterQuery);

	return {
		semester: semesterData.semester.id
	};
}
