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
				}
			}
		}
	`;

				const data = await request(env.PLEXAMS_SERVER, query);
				exams.push(data.generatedExam);
			}

			nta.exams = exams;
		}
	}

	return {
		ntasWithRegs
	};
}
