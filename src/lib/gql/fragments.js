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

// Standard-Auswahl eines NTA (Nachteilsausgleich) in Prüfungs-Sichten — die
// 9-Felder-Variante, die in exam/assembledExams (+[ancode]) und api/examsInSlot
// bislang byte-identisch dupliziert war. (Andere NTA-Auswahlen im Code sind
// bewusst kürzer/länger, z. B. mit needsHardware oder ohne Stammdaten — die
// bleiben inline.) Einsatz: `ntas { ${NTA_FIELDS} }`.
export const NTA_FIELDS = `
	name
	mtknr
	compensation
	deltaDurationPercent
	needsRoomAlone
	program
	from
	until
	lastSemester
`;
