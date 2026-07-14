import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

// Zwei Sichten auf dieselben Semester-NTAs: nach Studierenden (teuer, N+1)
// und nach Prüfungen. Es wird nur die aktive Sicht (?view) serverseitig
// geladen — Default ist die Studierenden-Sicht.
export const load: PageServerLoad = async ({ url }) => {
	const view = url.searchParams.get('view') === 'exams' ? 'exams' : 'students';

	if (view === 'exams') {
		return { view, examsWithNtas: await loadExams() };
	}
	return { view, ntasWithRegs: await loadStudents() };
};

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
	const data = await backendRequest(query);
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
				zpaAncodes
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

	const data = await backendRequest(query);
	const ntasWithRegs = data.ntasWithRegs;

	if (ntasWithRegs != null) {
		for (const nta of ntasWithRegs) {
			const exams = [];
			for (const ancode of nta.zpaAncodes) {
				const examQuery = gql`
					query {
						assembledExam(ancode: ${ancode}) {
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
				// Vor dem Generieren gibt es keine aufbereiteten Prüfungen —
				// assembledExam(ancode) wirft dann („no documents"). Solche (und
				// andere Teil-Query-Fehler) überspringen, statt die Seite mit 500
				// abstürzen zu lassen; die Prüfungsdetails erscheinen nach dem
				// Generieren.
				let examData: any;
				try {
					examData = await backendRequest(examQuery);
				} catch {
					continue;
				}
				if (!examData?.assembledExam) continue;

				// Raum/Slot/Aufsicht sind erst nach der Raum-/Aufsichtenplanung
				// vorhanden; Teil-Query-Fehler ignorieren, die assembledExam-Basis
				// bleibt trotzdem erhalten.
				try {
					const roomQuery = gql`
						query {
							plannedRoomForStudent(ancode: ${ancode}, mtknr: "${nta.mtknr}") {
								room {
									name
								}
							}
						}
					`;
					const roomData = await backendRequest(roomQuery);

					if (roomData?.plannedRoomForStudent?.room != null) {
						examData.assembledExam.roomName = roomData.plannedRoomForStudent.room.name;
					}

					const plannedExamQuery = gql`
						query {
							plannedExam(ancode: ${ancode}) {
								planEntry {
									starttime
								}
							}
						}
					`;
					const planData = await backendRequest(plannedExamQuery);

					if (planData?.plannedExam?.planEntry != null) {
						examData.assembledExam.starttime = planData.plannedExam.planEntry.starttime;

						if (examData.assembledExam.roomName != null) {
							const invigilatorQuery = gql`
								query {
									invigilator(room: "${examData.assembledExam.roomName}", starttime: "${planData.plannedExam.planEntry.starttime}") {
										shortname
									}
								}
							`;
							const invigilatorData = await backendRequest(invigilatorQuery);
							if (invigilatorData?.invigilator?.shortname != null) {
								examData.assembledExam.invigilator = invigilatorData.invigilator.shortname;
							}
						}
					}
				} catch {
					// Raum/Slot/Aufsicht noch nicht verfügbar → ohne diese Details.
				}

				exams.push(examData.assembledExam);
			}
			nta.exams = exams;
		}
	}

	return ntasWithRegs;
}
