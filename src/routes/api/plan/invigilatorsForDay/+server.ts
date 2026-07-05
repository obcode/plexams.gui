import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { day } = await request.json();
	return gqlProxy(
		gql`
			query ($day: Int!) {
				invigilatorsForDay(day: $day) {
					want {
						teacher {
							fullname
							shortname
							isProf
							isLBA
							isProfHC
							isStaff
							lastSemester
							fk
							id
							email
						}
						requirements {
							excludedDates
							examDays
							partTime
							oralExamsContribution
							liveCodingContribution
							masterContribution
							freeSemester
							overtimeLastSemester
							overtimeThisSemester
						}
						todos {
							totalMinutes
							doingMinutes
							enough
							invigilationDays
						}
					}
					can {
						teacher {
							fullname
							shortname
							isProf
							isLBA
							isProfHC
							isStaff
							lastSemester
							fk
							id
							email
						}
						requirements {
							excludedDates
							examDays
							partTime
							oralExamsContribution
							liveCodingContribution
							masterContribution
							freeSemester
							overtimeLastSemester
							overtimeThisSemester
						}
						todos {
							totalMinutes
							doingMinutes
							enough
							invigilationDays
						}
					}
				}
			}
		`,
		{ day }
	);
};
