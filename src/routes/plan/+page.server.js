import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
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

	const examGroupsWithoutSlotQuery = gql`
		query {
			examGroupsWithoutSlot {
				examGroupCode
				exams {
					exam {
						ancode
						zpaExam {
							ancode
							module
							mainExamer
							mainExamerID
							examType
							groups
							isRepeaterExam
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
						online
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

	const data = await request('http://localhost:8080/query', examGroupsWithoutSlotQuery);

	return {
		semesterConfig: semesterData.semesterConfig,
		examGroupsWithoutSlot: data.examGroupsWithoutSlot
	};
}
