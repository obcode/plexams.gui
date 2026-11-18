// Where each planning condition (start-page checklist, keys from the backend's
// planningState, see plexams.go/plexams/planning_state.go) is actually done in the GUI.
// Navigation is a GUI concern, so the backend carries no route. Keep this in sync when
// a condition or a route is added or renamed — conditionLinks.test.js checks the routes.
import { EMAIL_CONDITION } from '$lib/email/emailConditions';
import { emailGroups } from '$lib/email/emails';

/** @type {Record<string, string>} */
const PAGE_LINK = {
	// Phase -1
	zpaPersonsImported: '/zpa/publish',
	sebExahmDemandEntered: '/inquiries',
	annyRoomsBooked: '/rooms/annyBookings',
	sebExahmPreplanned: '/preplan',
	// Phase 0
	zpaImported: '/zpa/publish',
	sebExahmZpaConnected: '/preplan',
	zpaExamsSelected: '/exam/examsToPlan',
	mucDaiImported: '/primuss/joint',
	primussImported: '/primuss/exams',
	zpaPrimussConnected: '/exam/connected',
	constraintsEntered: '/exam/examsToPlan',
	assembledExams: '/exam/assembledExams',
	studentRegs: '/exam/assembledExams',
	studentRegsUploaded: '/zpa/publish',
	examPlanningInfoSent: '/email#examPlanningInfo',
	// Phase 1
	otherFKExamsScheduled: '/exam/external',
	exahmSebPlanned: '/plan/exams/roomsphase',
	exahmSebFixed: '/plan/exams/roomsphase',
	examScheduleGenerated: '/plan/exams/generate',
	// Phase 2
	roomsAssigned: '/plan/rooms/generate',
	// Phase 3
	invigReqsImported: '/zpa/publish',
	invigilationsAssigned: '/plan/invigilation/generate'
};

// Email conditions are derived from the email definitions, so a new mail is linked
// automatically: condition → its card on /email (the card's id is the email key).
/** @type {Record<string, string>} */
const EMAIL_LINK = {};
for (const [emailKey, cond] of Object.entries(EMAIL_CONDITION)) {
	EMAIL_LINK[cond] = `/email#${emailKey}`;
}
for (const email of emailGroups.flatMap((g) => g.emails)) {
	if (email.conditionKey) EMAIL_LINK[email.conditionKey] = `/email#${email.key}`;
}

/** @type {Record<string, string>} */
export const CONDITION_LINK = { ...EMAIL_LINK, ...PAGE_LINK };

/**
 * The page where the given planning condition is done, if known.
 * @param {string} key
 * @returns {string | undefined}
 */
export function conditionLink(key) {
	return CONDITION_LINK[key];
}
