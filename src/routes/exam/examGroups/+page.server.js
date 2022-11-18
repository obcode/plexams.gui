import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			examGroups {
				examGroupCode
				exams {
					exam {
						ancode
						zpaExam {
							ancode
							module
							mainExamer
							examType
							groups
						}
						primussExams {
							ancode
							module
							mainExamer
							program
							examType
						}
						studentRegs {
							program
							studentRegs {
								mtknr
								ancode
								program
								presence
								group
								name
							}
						}
						conflicts {
							program
							conflics {
								ancode
								numberOfStuds
							}
						}
						connectErrors
					}
					constraints {
						ancode
						notPlannedByMe
						excludeDays
						roomConstraints {
							placesWithSocket
						}
					}
				}
				examGroupInfo {
					notPlannedByMe
					excludeDays
					possibleDays
					fixedDay
					fixedSlot {
						dayNumber
						slotNumber
						starttime
					}
					possibleSlots {
						dayNumber
						slotNumber
						starttime
					}
					conflicts {
						examGroupCode
						count
					}
					studentRegs
					programs
					maxDuration
					maxDurationNTA
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		examGroups: data.examGroups
	};
}
