// Zentrale GraphQL-Feld-Sets als interpolierbare Strings — eine Quelle der
// Wahrheit für Auswahlmengen, die bislang über viele +page.server.js/+server.js
// dupliziert waren (siehe Warnung in CLAUDE.md). Einsatz per Template-
// Interpolation in gql`...` (graphql-request), z. B.:
//
//   import { ZPA_EXAM_FIELDS } from '$lib/gql/fragments';
//   const query = gql`query { toPlan: zpaExamsToPlanWithConstraints {
//     zpaExam { ${ZPA_EXAM_FIELDS} } } }`;
//
// Beim Ergänzen eines Feldes reicht künftig eine Änderung hier.

// Kern-Felder einer ZPA-Prüfung (Planungs-Sicht ohne faculty/zpaID).
export const ZPA_EXAM_FIELDS = `
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
