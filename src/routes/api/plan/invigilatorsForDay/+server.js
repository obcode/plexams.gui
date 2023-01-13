import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const query = gql`
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
						examDateTimes
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
						examDateTimes
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
	`;

	const { day } = await request.json();

	const variables = {
		day
	};

	const data = await gqlrequest(env.PLEXAMS_SERVER, query, variables);

	return json(data);
}
