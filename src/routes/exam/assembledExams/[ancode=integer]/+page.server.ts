import { error } from '@sveltejs/kit';
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
	if (data.assembledExam) {
		return { assembledExam: data.assembledExam, notAssembled: false };
	}

	// Before the exams are assembled (e.g. during the Vorplanung) there is no
	// assembled exam yet — todo links point here all the same. Show what is known
	// without registrations: the ZPA exam and its constraints.
	const fallback = await backendRequest(gql`
		query {
			zpaExam(ancode: ${params.ancode}) {
				ancode
				module
				mainExamer
				examTypeFull
				duration
				isRepeaterExam
				groups
				primussAncodes {
					program
					ancode
				}
			}
			constraintForAncode(ancode: ${params.ancode}) {
				notPlannedByMe
				excludeDays
				possibleDays
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
		}
	`);
	if (!fallback.zpaExam) {
		error(404, `Prüfung ${params.ancode} gibt es in diesem Semester nicht.`);
	}
	return {
		assembledExam: {
			ancode: fallback.zpaExam.ancode,
			zpaExam: fallback.zpaExam,
			constraints: fallback.constraintForAncode,
			primussExams: [],
			conflicts: []
		},
		notAssembled: true
	};
};
