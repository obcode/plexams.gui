import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const semesterQuery = gql`
		query {
			semesterConfig {
				days {
					number
					date
				}
				starttimes {
					number
					start
				}
			}
		}
	`;

	const semesterData = await request<any>(env.PLEXAMS_SERVER, semesterQuery);

	return {
		semesterConfig: semesterData.semesterConfig,
		day: params.day
	};
};
