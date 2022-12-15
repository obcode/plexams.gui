import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			examsInPlan {
				exam {
					ancode
					zpaExam {
						module
						mainExamer
					}
				}
				slot {
					starttime
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		examsInPlan: data.examsInPlan
	};
}
