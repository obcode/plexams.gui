import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';

// Abfragen an die Prüfenden (Portal) im aktiven Semester: einrichten, öffnen,
// schließen, und der Posteingang der Meldungen.
/** @type {import('./$types').PageServerLoad} */
export async function load() {
	try {
		const data = await backendRequest(gql`
			query {
				inquiries {
					semester
					kind
					state
					deadline
					intro
					openedAt
					openedBy
					closedAt
					closedBy
					submissions
					openSubmissions
					nothingToReport
				}
				inquiryInboxSummary {
					semester
					kind
					open
				}
				inquirySubmissions(kind: PREPLAN) {
					id
					revision
					teacherID
					teacherName
					createdBy
					submittedBy
					submittedAt
					channel
					withdrawn
					preplanExamID
					review
					reviewNote
					reviewedRevision
					preplan {
						examKind
						module
						programs
						expectedStudents
						durationMin
						remark
					}
					reviewedPreplan {
						examKind
						module
						programs
						expectedStudents
						durationMin
						remark
					}
				}
			}
		`);
		return {
			inquiries: data.inquiries,
			inbox: data.inquiryInboxSummary,
			submissions: data.inquirySubmissions,
			loadError: ''
		};
	} catch (e) {
		return { inquiries: [], inbox: [], submissions: [], loadError: gqlErrorMessage(e) };
	}
}
