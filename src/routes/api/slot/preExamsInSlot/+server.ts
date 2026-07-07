import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { starttime } = await request.json();
	return gqlProxy(
		gql`
			query ($starttime: Time!) {
				preExamsAt(starttime: $starttime) {
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
						starttime
						external
						ancode
						locked
					}
				}
			}
		`,
		{ starttime }
	);
};
