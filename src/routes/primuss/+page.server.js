import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			primussExams {
				program
				exams {
					ancode
					module
					mainExamer
					program
					examType
					presence
					studentRegs {
						name
					}
					conflicts {
						conflicts {
							ancode
						}
					}
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		primussExams: data.primussExams
	};
}
