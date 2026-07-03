import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const query = gql`
		query {
			roomRequestsPreview {
				room
				day
				slot
				from
				until
				students
				seats
				exam {
					ancode
					studentRegsCount
					zpaExam {
						module
						mainExamer
						duration
					}
					ntas {
						name
						deltaDurationPercent
						needsRoomAlone
					}
				}
				simultaneousExams {
					ancode
					studentRegsCount
					zpaExam {
						module
						mainExamer
					}
				}
			}
		}
	`;

	return gqlProxy(query);
}
