import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
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

	const semesterData = await request(env.PLEXAMS_SERVER, semesterQuery);

	const workflowQuery = gql`
		query {
			workflow {
				number
				name
				done
				deadline
			}
		}
	`;

	const workflowData = await request('http://localhost:8080/query', workflowQuery);

	return {
		semesterConfig: semesterData.semesterConfig
	};
}
