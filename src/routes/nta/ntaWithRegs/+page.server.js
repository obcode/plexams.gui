import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { append } from 'svelte/internal';

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

				const roomData = await request(env.PLEXAMS_SERVER, roomQuery).catch((e) => {
					(e) => console.log(e);
				});

				if (
					roomData != null &&
					roomData.plannedRoomForStudent != null &&
					roomData.plannedRoomForStudent.room != null
				) {
					data.generatedExam.roomName = roomData.plannedRoomForStudent.room.name;
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
