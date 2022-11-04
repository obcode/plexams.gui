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
		semester: semesterData.semester.id,
		workflow: workflowData.workflow
	};
}
