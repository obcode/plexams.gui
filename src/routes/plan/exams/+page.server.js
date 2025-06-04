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
				goSlots {
					dayNumber
					slotNumber
				}
				starttimes {
					number
					start
				}
				forbiddenSlots {
					dayNumber
					slotNumber
				}
			}
		}
	`;

	const semesterData = await request(env.PLEXAMS_SERVER, semesterQuery);

	const examsWithoutSlotQuery = gql`
		query {
			examsWithoutSlot {
				ancode
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
				primussExams {
					exam {
						ancode
						module
						mainExamer
						program
						examType
						presence
					}
					studentRegs {
						mtknr
						ancode
						program
						group
						name
						presence
					}
					conflicts {
						ancode
						numberOfStuds
					}
					ntas {
						name
						mtknr
						compensation
						deltaDurationPercent
						needsRoomAlone
						needsHardware
						program
						from
						until
						lastSemester
						exams {
							semester
							ancode
							module
							mainExamer
						}
					}
				}
				constraints {
					ancode
					notPlannedByMe
					excludeDays
					possibleDays
					fixedDay
					fixedTime
					sameSlot
					online
					roomConstraints {
						placesWithSocket
						lab
						exahm
						seb
					}
				}
				conflicts {
					ancode
					numberOfStuds
					primussAncodes {
						ancode
						program
						numberOfStuds
					}
				}
				studentRegsCount
				maxDuration
				planEntry {
					dayNumber
					slotNumber
					ancode
					locked
				}
			}
		}
	`;

	const data = await request('http://localhost:8080/query', examsWithoutSlotQuery);

	let semesterConfig = semesterData.semesterConfig;

	let globalSlotStatus = new Map();

	for (let day of semesterConfig.days) {
		for (let time of semesterConfig.starttimes) {
			const key = `${day.number},${time.number}`;
			globalSlotStatus.set(key, 'okay');
		}
	}

	if (semesterConfig.forbiddenSlots) {
		for (let slot of semesterConfig.forbiddenSlots) {
			const key = `${slot.dayNumber},${slot.slotNumber}`;
			globalSlotStatus.set(key, 'forbidden');
		}
	}

	return {
		semesterConfig: semesterData.semesterConfig,
		examsWithoutSlot: data.examsWithoutSlot,
		globalSlotStatus: globalSlotStatus
	};
}
