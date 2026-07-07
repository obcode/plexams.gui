import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const query = gql`
		query {
			roomRequestsPreview {
				room
				starttime
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
};
