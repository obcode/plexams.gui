import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
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
						ancode
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

	const data = await request<any>(env.PLEXAMS_SERVER, query);

	return {
		assembledExam: data.assembledExam
	};
};
