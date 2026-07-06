import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { day, time } = await request.json();
	return gqlProxy(
		gql`
			query ($day: Int!, $time: Int!) {
				preExamsInSlot(day: $day, time: $time) {
					zpaExam {
						zpaID
						semester
						ancode
						module
						mainExamer
						mainExamerID
						examType
						examTypeFull
						duration
						isRepeaterExam
						groups
						primussAncodes {
							program
							ancode
						}
					}
					constraints {
						ancode
						notPlannedByMe
						online
						excludeDays
						possibleDays
						sameSlot
						roomConstraints {
							placesWithSocket
							lab
							exahm
							seb
							kdpJiraURL
							maxStudents
							comments
						}
					}
					planEntry {
						dayNumber
						slotNumber
						starttime
						external
						ancode
						locked
					}
				}
			}
		`,
		{ day, time }
	);
};
