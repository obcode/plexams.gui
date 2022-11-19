import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { append } from 'svelte/internal';

export async function load({ params }) {
	const query = gql`
		query {
			ntasWithRegs {
				nta {
					mtknr
					name
					compensation
					needsRoomAlone
				}
				regs {
					ancodes
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	let ntasWithRegs = data.ntasWithRegs;

	if (data.ntasWithRegs != null) {
		for (let nta of ntasWithRegs) {
			let exams = [];
			for (const ancode of nta.regs.ancodes) {
				const query = gql`
		query {
			zpaExam(ancode: ${ancode}) {
				ancode
				mainExamer
				module
				examType
			}
		}
	`;

				const data = await request(env.PLEXAMS_SERVER, query);
				exams.push(data.zpaExam);
			}

			nta.exams = exams;
		}
	}

	return {
		ntasWithRegs
	};
}
