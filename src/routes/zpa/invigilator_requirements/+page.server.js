import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			invigilatorsWithReq {
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
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	const queryTodos = gql`
		query {
			invigilatorTodos {
				sumExamRooms
				sumReserve
				sumOtherContributions
				invigilatorCount
				todoPerInvigilator
			}
		}
	`;

	const dataTodos = await request(env.PLEXAMS_SERVER, queryTodos);

	return {
		invigilatorsWithReq: data.invigilatorsWithReq,
		todos: dataTodos.invigilatorTodos
	};
}
