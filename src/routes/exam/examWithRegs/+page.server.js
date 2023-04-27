import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			examsWithRegs {
				ancode
				zpaExam {
					ancode
					module
					mainExamer
					examType
					examTypeFull
					groups
				}
				primussExams {
					ancode
					module
					mainExamer
					program
					examType
				}
				studentRegs {
					program
					studentRegs {
						mtknr
						ancode
						program
						presence
						group
						name
					}
				}
				conflicts {
					program
					conflicts {
						ancode
						numberOfStuds
					}
				}
				connectErrors
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		examsWithRegs: data.examsWithRegs
	};
}
