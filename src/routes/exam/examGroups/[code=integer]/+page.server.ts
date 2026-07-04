import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	let query = gql`
		query {
			examGroup(examGroupCode: ${params.code}) {
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
							conflicts {
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

	let data = await request<any>(env.PLEXAMS_SERVER, query);

	const group = data.examGroup;

	const conflicts = [];

	for (const otherGroup of data.examGroup.examGroupInfo.conflicts) {
		query = gql`
		query {
			examGroup(examGroupCode: ${otherGroup.examGroupCode}) {
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
							conflicts {
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
		data = await request<any>(env.PLEXAMS_SERVER, query);

		conflicts.push({ group: data.examGroup, count: otherGroup.count });
	}

	return {
		group,
		conflicts
	};
};
