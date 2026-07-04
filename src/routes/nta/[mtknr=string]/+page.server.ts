import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const query = gql`
		query {
			nta(mtknr: "${params.mtknr}") {
				nta {
					mtknr
					name
					email
					compensation
					deltaDurationPercent
					needsRoomAlone
					needsHardware
					program
					from
					until
					lastSemester
					deactivated
				}
				regs {
					ancodes
				}
			}
		}
	`;

	const data = await request<any>(env.PLEXAMS_SERVER, query);

	const nta = data.nta;

	if (data.nta != null) {
		const exams = [];
		for (const ancode of data.nta.regs.ancodes) {
			const examQuery = gql`
		query {
			zpaExam(ancode: ${ancode}) {
				ancode
				mainExamer
				module
				examTypeFull
			}
		}
	`;

			const examData = await request<any>(env.PLEXAMS_SERVER, examQuery);
			exams.push(examData.zpaExam);
		}

		nta.exams = exams;
	}

	return {
		nta
	};
};
