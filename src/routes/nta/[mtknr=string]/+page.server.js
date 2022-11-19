import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { append } from 'svelte/internal';

export async function load({ params }) {
	const query = gql`
		query {
			nta(mtknr: "${params.mtknr}") {
				nta {
					mtknr
					name
					compensation
				}
				regs {
					ancodes
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	let nta = data.nta;

	if (data.nta != null) {
		let exams = [];
		for (const ancode of data.nta.regs.ancodes) {
			const query = gql`
		query {
			zpaExam(ancode: ${ancode}) {
				ancode
				mainExamer
				module
				examTypeFull
			}
		}
	`;

			const data = await request(env.PLEXAMS_SERVER, query);
			exams.push(data.zpaExam);
		}

		nta.exams = exams;
	}

	return {
		nta
	};
}
