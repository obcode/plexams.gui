import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			ntasWithRegsByTeacher {
				teacher {
					fullname
					shortname
				}
				exams {
					exam {
						ancode
						module
						mainExamer
						examType
						groups
						examTypeFull
						zpaID
					}

					ntas {
						nta {
							mtknr
							name
							compensation
							needsRoomAlone
						}
						regs {
							ancodes
						}
					}
				}
			}
		}
	`;

	let data = await request(env.PLEXAMS_SERVER, query);

	return {
		ntasWithRegsByTeacher: data.ntasWithRegsByTeacher
	};
}
