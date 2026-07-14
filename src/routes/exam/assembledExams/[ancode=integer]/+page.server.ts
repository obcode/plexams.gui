import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { NTA_FIELDS } from '$lib/gql/fragments';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const query = gql`
			query {
			assembledExam(ancode: ${params.ancode}) {
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
						primussAncode
						program
						group
						name
						presence
						zpaStudent {
							email
							gender
						}
					}
					conflicts {
						ancode
						numberOfStuds
					}
					ntas {
						${NTA_FIELDS}
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
						preExamMinutes
						postExamMinutes
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
			}
		}
	`;

	const data = await backendRequest(query);

	return {
		assembledExam: data.assembledExam
	};
};
