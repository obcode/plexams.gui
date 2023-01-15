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
						invigilations {
							roomName
							slot {
								dayNumber
								slotNumber
							}
							isReserve
							isSelfInvigilation
						}
					}
				}
			}
		}
	`;

	const dataTodos = await request(env.PLEXAMS_SERVER, queryTodos);

	const semesterQuery = gql`
		query {
			semesterConfig {
				days {
					number
					date
				}
				starttimes {
					number
					start
				}
			}
		}
	`;

	const semesterData = await request(env.PLEXAMS_SERVER, semesterQuery);

	return {
		semesterConfig: semesterData.semesterConfig,
		todos: dataTodos.invigilatorTodos
	};
}
