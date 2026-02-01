import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
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

	let ntasWithRegs = data.ntasWithRegs;

	if (data.ntasWithRegs != null) {
		for (let nta of ntasWithRegs) {
			let exams = [];
			for (const ancode of nta.regs) {
				const query = gql`
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

				const data = await request(env.PLEXAMS_SERVER, query);

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

				if (
					roomData != null &&
					roomData.plannedRoomForStudent != null &&
					roomData.plannedRoomForStudent.room != null
				) {
					data.generatedExam.roomName = roomData.plannedRoomForStudent.room.name;
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
				}`;

				const planData = await request(env.PLEXAMS_SERVER, plannedExamQuery);

				if (
					planData != null &&
					planData.plannedExam != null &&
					planData.plannedExam.planEntry != null
				) {
					data.generatedExam.starttime = planData.plannedExam.planEntry.starttime;

					if (data.generatedExam.roomName != null) {
						const invigilatorQuery = gql`
						query {
							invigilator(room: "${data.generatedExam.roomName}", day: ${planData.plannedExam.planEntry.dayNumber}, time: ${planData.plannedExam.planEntry.slotNumber}) {
								shortname
							 }
						}`;

						console.log(invigilatorQuery);

						const invigilatorData = await request(env.PLEXAMS_SERVER, invigilatorQuery);

						console.log(invigilatorData);

						if (
							invigilatorData != null &&
							invigilatorData.invigilator != null &&
							invigilatorData.invigilator.shortname != null
						) {
							data.generatedExam.invigilator = invigilatorData.invigilator.shortname;
						}
					}
				}

				exams.push(data.generatedExam);
			}

			nta.exams = exams;
		}
	}

	return {
		ntasWithRegs
	};
}
