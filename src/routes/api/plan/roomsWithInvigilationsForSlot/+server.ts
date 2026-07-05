import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { day, time } = await request.json();
	return gqlProxy(
		gql`
			query ($day: Int!, $time: Int!) {
				roomsWithInvigilationsForSlot(day: $day, time: $time) {
					reserve {
						shortname
						id
					}
					roomsWithInvigilators {
						name
						maxDuration
						studentCount
						roomAndExams {
							room {
								room {
									name
								}
								duration
								studentsInRoom
							}
							exam {
								ancode
								module
								mainExamer
								mainExamerID
							}
						}
						invigilator {
							shortname
							id
						}
					}
				}
			}
		`,
		{ day, time }
	);
};
