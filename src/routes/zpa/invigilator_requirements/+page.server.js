import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const queryTodos = gql`
		query {
			invigilatorTodos {
				sumExamRooms
				sumReserve
				sumOtherContributions
				sumOtherContributionsOvertimeCutted
				invigilatorCount
				todoPerInvigilator
				todoPerInvigilatorOvertimeCutted
				invigilators {
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
						excludedDays
						examDateTimes
						examDays
						partTime
						oralExamsContribution
						liveCodingContribution
						masterContribution
						freeSemester
						overtimeLastSemester
						overtimeThisSemester
						allContributions
						factor
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

	const dataTodos = await request(env.PLEXAMS_SERVER, queryTodos);

	return {
		todos: dataTodos.invigilatorTodos
	};
}
