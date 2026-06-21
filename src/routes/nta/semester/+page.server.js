import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

// Zwei Sichten auf dieselben Semester-NTAs: nach Studierenden (teuer, N+1)
// und nach Prüfungen. Es wird nur die aktive Sicht (?view) serverseitig
// geladen — Default ist die Studierenden-Sicht.
export async function load({ url }) {
	const view = url.searchParams.get('view') === 'exams' ? 'exams' : 'students';

	if (view === 'exams') {
		return { view, examsWithNtas: await loadExams() };
	}
	return { view, ntasWithRegs: await loadStudents() };
}

async function loadExams() {
	const query = gql`
		query {
			examsWithNtas {
				ancode
				zpaExam {
					module
					mainExamer
					duration
				}
				mainExamer {
					shortname
					isLBA
					fk
				}
				primussExams {
					exam {
						program
						ancode
					}
				}
				constraints {
					roomConstraints {
						exahm
						seb
					}
				}
				ntas {
					name
					deltaDurationPercent
					needsRoomAlone
				}
				maxDuration
				planEntry {
					locked
					starttime
				}
			}
		}
	`;
	const data = await request(env.PLEXAMS_SERVER, query);
	return data.examsWithNtas;
}

async function loadStudents() {
	const query = gql`
		query {
			ntasWithRegs {
				name
				mtknr
				program
				group
				regs
				nta {
					name
					email
					mtknr
					compensation
					deltaDurationPercent
					needsRoomAlone
					needsHardware
					program
					from
					until
					lastSemester
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);
	const ntasWithRegs = data.ntasWithRegs;

	if (ntasWithRegs != null) {
		for (let nta of ntasWithRegs) {
			let exams = [];
			for (const ancode of nta.regs) {
				const examQuery = gql`
					query {
						generatedExam(ancode: ${ancode}) {
							ancode
							zpaExam {
								mainExamer
								module
								examType
							}
							constraints {
								notPlannedByMe
								roomConstraints {
									seb
									exahm
								}
							}
						}
					}
				`;
				const examData = await request(env.PLEXAMS_SERVER, examQuery);

				const roomQuery = gql`
					query {
						plannedRoomForStudent(ancode: ${ancode}, mtknr: "${nta.mtknr}") {
							room {
								name
							}
						}
					}
				`;
				const roomData = await request(env.PLEXAMS_SERVER, roomQuery);

				if (roomData?.plannedRoomForStudent?.room != null) {
					examData.generatedExam.roomName = roomData.plannedRoomForStudent.room.name;
				}

				const plannedExamQuery = gql`
					query {
						plannedExam(ancode: ${ancode}) {
							planEntry {
								starttime
								dayNumber
								slotNumber
							}
						}
					}
				`;
				const planData = await request(env.PLEXAMS_SERVER, plannedExamQuery);

				if (planData?.plannedExam?.planEntry != null) {
					examData.generatedExam.starttime = planData.plannedExam.planEntry.starttime;

					if (examData.generatedExam.roomName != null) {
						const invigilatorQuery = gql`
							query {
								invigilator(room: "${examData.generatedExam.roomName}", day: ${planData.plannedExam.planEntry.dayNumber}, time: ${planData.plannedExam.planEntry.slotNumber}) {
									shortname
								}
							}
						`;
						const invigilatorData = await request(env.PLEXAMS_SERVER, invigilatorQuery);
						if (invigilatorData?.invigilator?.shortname != null) {
							examData.generatedExam.invigilator = invigilatorData.invigilator.shortname;
						}
					}
				}

				exams.push(examData.generatedExam);
			}
			nta.exams = exams;
		}
	}

	return ntasWithRegs;
}
