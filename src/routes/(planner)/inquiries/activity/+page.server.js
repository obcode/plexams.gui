import { gql } from 'graphql-request';
import { backendRequest } from '#lib/server/backend.js';
import { gqlErrorMessage } from '#lib/gqlError.js';

// Alle Eingaben über das Portal, neueste zuerst – über alle Semester. Filter über die
// URL (?semester=…&kind=…&before=…), damit eine gefilterte Ansicht verlinkbar ist.
/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const semester = url.searchParams.get('semester') || null;
	const kind = url.searchParams.get('kind') || null;
	const beforeRaw = url.searchParams.get('before');
	const before = beforeRaw && /^\d+$/.test(beforeRaw) ? Number(beforeRaw) : null;
	try {
		const data = await backendRequest(
			gql`
				query ($semester: String, $kind: InquiryKind, $before: Int) {
					inquiryActivity(semester: $semester, kind: $kind, before: $before, first: 100) {
						id
						semester
						at
						actor
						channel
						teacherID
						teacherName
						kind
						action
						submissionID
						revision
						label
						changes {
							field
							old
							new
						}
					}
					myNotificationSetting {
						mode
						seenUpTo
					}
				}
			`,
			{ semester, kind, before }
		);
		return {
			activity: data.inquiryActivity,
			setting: data.myNotificationSetting,
			filter: { semester, kind, before },
			loadError: ''
		};
	} catch (e) {
		return {
			activity: [],
			setting: null,
			filter: { semester, kind, before },
			loadError: gqlErrorMessage(e)
		};
	}
}
