import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

const ZPA_FIELDS = `
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
`;

export async function load() {
	const query = gql`
		query {
			toPlan: zpaExamsToPlanWithConstraints {
				zpaExam {
					${ZPA_FIELDS}
				}
				constraints {
					ancode
					notPlannedByMe
					online
					excludeDays
					possibleDays
					sameSlot
					roomConstraints {
						allowedRooms
						placesWithSocket
						lab
						exahm
						seb
						kdpJiraURL
						maxStudents
						comments
					}
				}
			}
			notToPlan: zpaExamsNotToPlan {
				${ZPA_FIELDS}
			}
			unknown: zpaExamsPlaningStatusUnknown {
				ancode
				module
				mainExamer
				mainExamerID
				examType
				examTypeFull
				duration
				isRepeaterExam
				groups
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	/** @type {any[]} */
	const items = [
		...(data.toPlan ?? []).map((/** @type {any} */ x) => ({
			...x.zpaExam,
			status: 'toPlan',
			constraints: x.constraints ?? null
		})),
		...(data.notToPlan ?? []).map((/** @type {any} */ e) => ({
			...e,
			status: 'notToPlan',
			constraints: null
		})),
		...(data.unknown ?? []).map((/** @type {any} */ e) => ({
			...e,
			status: 'unknown',
			constraints: null,
			primussAncodes: []
		}))
	].sort((a, b) => a.ancode - b.ancode);

	return { items };
}
