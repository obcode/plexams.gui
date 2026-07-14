import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
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

	const data = await backendRequest(query);

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

			const examData = await backendRequest(examQuery);
			exams.push(examData.zpaExam);
		}

		nta.exams = exams;
	}

	return {
		nta
	};
};
