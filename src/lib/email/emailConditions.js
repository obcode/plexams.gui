// Zuordnung E-Mail-Subscription → planningState-Bedingung. Ist die Bedingung
// `done`, gilt die Mail als „bereits versendet": nur noch Probelauf anbieten.
/** @type {Record<string, string>} */
export const EMAIL_CONDITION = {
	sendEmailExaHM: 'exahmRequested',
	sendEmailConstraints: 'constraintsRequested',
	sendEmailPrepared: 'examsPrepared',
	sendEmailDraft: 'draftSent',
	sendEmailPublishedExams: 'examPlanPublished',
	sendEmailPublishedRooms: 'roomPlanPublished',
	sendEmailPublishedInvigilations: 'invigilationPlanPublished',
	sendEmailRoomRequests: 'roomRequestsSent',
	sendEmailInvigilations: 'invigilationsRequested'
};

/**
 * Flacht planningState.phases zu einer Map conditionKey → done ab.
 * @param {any} planningState
 * @returns {Record<string, boolean>}
 */
export function conditionsDoneMap(planningState) {
	/** @type {Record<string, boolean>} */
	const m = {};
	for (const p of planningState?.phases ?? []) {
		for (const c of p.conditions ?? []) m[c.key] = !!c.done;
	}
	return m;
}
