// What each step of the planning checklist means, for a planner who is new to exam
// planning. Keys are the condition keys of the backend's planningState
// (plexams.go/plexams/planning_state.go); the titles come from the backend, the
// explanations live here because they refer to pages of this GUI.
// workflow.test.js fails when the backend's step list and this file drift apart.

/**
 * @typedef {Object} StepHelp
 * @property {string} what  what to do, and where
 * @property {string} why   why the step exists / what depends on it
 * @property {string} [note] a trap worth knowing
 */

/** @type {Record<string, { title: string, intro: string }>} */
export const PHASE_HELP = {
	phaseMinus1: {
		title: 'Phase −1: noch im vorherigen Semester',
		intro:
			'Rechnerprüfungen (EXaHM und SEB) brauchen die besonderen Räume im T-Bau, und die müssen lange vorher gebucht werden. Deshalb beginnt die Planung schon im Semester davor: Bedarf abfragen, Räume buchen, die Rechnerprüfungen grob auf die gebuchten Zeiten verteilen.'
	},
	phase0: {
		title: 'Phase 0: Vorbereitung',
		intro:
			'Hier kommen die Daten zusammen: die Prüfungen aus dem ZPA, die Anmeldungen der Studierenden aus Primuss und die Wünsche der Prüfenden. Erst wenn beides verknüpft ist, weiß Plexams, welche Prüfungen sich Studierende teilen und deshalb nicht gleichzeitig liegen dürfen.'
	},
	phase1: {
		title: 'Phase 1: Terminplanung',
		intro:
			'Jede Prüfung bekommt Tag und Uhrzeit. Den Großteil erledigt der Generator; du prüfst das Ergebnis, bewertest die verbleibenden Konflikte und besserst von Hand nach. Am Ende geht der Plan als Entwurf an die Prüfenden und wird nach der Abstimmung veröffentlicht.'
	},
	phase2: {
		title: 'Phase 2: Raumplanung',
		intro:
			'Jede terminierte Prüfung bekommt Räume, und jede:r Studierende einen Platz. Räume, die nicht der Fakultät gehören, müssen vorher beim Gebäudemanagement angefragt werden.'
	},
	phase3: {
		title: 'Phase 3: Aufsichtenplanung',
		intro:
			'Für jeden Raum und jede Prüfungszeit wird eine Aufsicht eingeteilt, dazu Reserveaufsichten. Vorher geben die Aufsichtführenden an, wann sie nicht können.'
	}
};

/** @type {Record<string, StepHelp>} */
export const STEP_HELP = {
	// --- Phase -1 ---
	zpaPersonsImported: {
		what: 'Auf „ZPA-Import & Veröffentlichung" die Lehrenden aus dem ZPA laden.',
		why: 'Plexams braucht Namen und E-Mail-Adressen der Prüfenden, um sie anzuschreiben und ihnen Prüfungen zuzuordnen.'
	},
	exahmRequested: {
		what: 'Auf „E-Mails" die Abfrage verschicken, wer im kommenden Semester eine EXaHM- oder SEB-Prüfung plant.',
		why: 'Aus den Antworten ergibt sich, wie viele T-Bau-Räume zu welchen Zeiten gebucht werden müssen.',
		note: 'Diese E-Mail geht nur einmal raus. Vorher mit dem Probelauf ansehen.'
	},
	sebExahmDemandEntered: {
		what: 'Auf „Abfragen an Prüfende" die Meldungen der Prüfenden durchsehen und übernehmen; Meldungen, die auf anderem Weg kommen, in der EXaHM/SEB-Vorplanung von Hand anlegen.',
		why: 'Erst wenn der Bedarf vollständig ist, lohnt sich das Buchen der Räume.'
	},
	annyRoomsBooked: {
		what: 'Die T-Bau-Räume in Anny buchen (das geschieht in Anny selbst, nicht in Plexams) und die Buchungen danach auf „Anny-Buchungen" abrufen.',
		why: 'EXaHM- und SEB-Prüfungen können nur zu Zeiten stattfinden, für die ein T-Bau-Raum gebucht ist.',
		note: 'Buchungen brauchen Vor- und Nachlauf: in der Regel 30 Minuten davor und danach, bei EXaHM-Prüfungen mit 120 Minuten 60 Minuten.'
	},
	sebExahmPreplanned: {
		what: 'Auf „SEB/EXaHM-Vorplanung" die gemeldeten Rechnerprüfungen auf die gebuchten Zeiten verteilen, von Hand oder mit „Automatisch verteilen".',
		why: 'So zeigt sich früh, ob die gebuchten Räume reichen oder noch Buchungen fehlen.'
	},

	// --- Phase 0 ---
	zpaImported: {
		what: 'Auf „ZPA-Import & Veröffentlichung" die Prüfungen aus dem ZPA laden.',
		why: 'Das ZPA führt die offizielle Liste aller Prüfungen des Semesters. Sie ist die Grundlage für alles Weitere.',
		note: 'ZPA-Daten werden in Plexams nicht verändert. Stimmt dort etwas nicht, muss es im ZPA korrigiert und neu geladen werden.'
	},
	sebExahmZpaConnected: {
		what: 'Auf „SEB/EXaHM-Vorplanung" jede vorgeplante Rechnerprüfung der passenden ZPA-Prüfung zuordnen (Ancode zuordnen).',
		why: 'Die Vorplanung entstand, bevor es die ZPA-Prüfungen gab. Erst mit der Zuordnung übernimmt die echte Prüfung den vorgeplanten Termin.'
	},
	mucDaiImported: {
		what: 'Auf „Prüfungen gemeinsamer Studiengänge" die CSV-Dateien der anderen Fakultäten importieren und die Prüfungen mit den ZPA-Prüfungen verknüpfen.',
		why: 'In gemeinsamen Studiengängen (zum Beispiel MUC.DAI) schreiben Studierende auch Prüfungen anderer Fakultäten. Nur wenn Plexams sie kennt, kann es Überschneidungen vermeiden.'
	},
	zpaExamsSelected: {
		what: 'Auf „Prüfungen auswählen & Vorgaben" für jede ZPA-Prüfung entscheiden, ob sie von uns geplant wird.',
		why: 'Nicht alles im ZPA braucht einen Termin im Prüfungszeitraum: mündliche Prüfungen, Scheine oder Modularbeiten zum Beispiel nicht.'
	},
	examPlanningInfoSent: {
		what: 'Auf „E-Mails" die Prüfungsplanungs-Info an die Prüfenden verschicken.',
		why: 'Die Prüfenden sehen, welche ihrer Prüfungen geplant werden, und können Besonderheiten melden (fester Termin, ausgeschlossene Tage, besondere Räume).',
		note: 'Diese E-Mail geht nur einmal raus.'
	},
	primussImported: {
		what: 'Auf „Prüfungslisten aus Primuss" das ZIP mit den Sammellisten aller Studiengänge hochladen.',
		why: 'Die Sammellisten enthalten, wer sich zu welcher Prüfung angemeldet hat. Daraus entstehen Teilnehmerzahlen und die Konflikte zwischen Prüfungen.',
		note: 'Die Sammellisten liefert das Prüfungsamt, sobald die Anmeldefrist vorbei ist.'
	},
	zpaPrimussConnected: {
		what: 'Auf „Zuordnung ZPA ↔ Primuss" prüfen, ob jede zu planende ZPA-Prüfung ihre Primuss-Anmeldungen gefunden hat, und fehlende oder falsche Zuordnungen korrigieren.',
		why: 'Die beiden Systeme verwenden nicht immer denselben Ancode, vor allem in gemeinsamen Studiengängen. Eine falsche Zuordnung heißt: falsche Teilnehmerzahl und falsche Konflikte.'
	},
	constraintsEntered: {
		what: 'Auf „Prüfungen auswählen & Vorgaben" die gemeldeten Vorgaben je Prüfung eintragen: fester Termin, ausgeschlossene Tage, „gleichzeitig mit", Raumanforderungen.',
		why: 'Generator und Validierung halten sich an diese Vorgaben. Was hier fehlt, wird beim Planen nicht berücksichtigt.'
	},
	assembledExams: {
		what: 'Auf „Aufbereitete Prüfungen" auf „Generieren" klicken.',
		why: 'Plexams führt dabei je Prüfung alles zusammen: ZPA-Daten, Primuss-Anmeldungen, Nachteilsausgleiche und Vorgaben. Mit diesen aufbereiteten Prüfungen arbeiten Terminplanung, Raumplanung und Aufsichten.',
		note: 'Nach jeder Änderung an Anmeldungen, Nachteilsausgleichen oder Vorgaben neu generieren. Ein Hinweis oben auf der Seite erinnert daran.'
	},
	studentRegs: {
		what: 'Nichts Eigenes: „Generieren" auf „Aufbereitete Prüfungen" erzeugt die Anmeldungen im selben Schritt mit.',
		why: 'Je Studierender:m entsteht eine Liste aller Anmeldungen. Sie ist die Grundlage der Konfliktprüfung.'
	},
	studentRegsUploaded: {
		what: 'Auf „ZPA-Import & Veröffentlichung" die Anmeldungen ins ZPA übertragen.',
		why: 'Danach sehen die Studierenden ihre Prüfungen im ZPA.',
		note: 'Bei später geänderten Anmeldungen erneut übertragen.'
	},
	primussDataAllSent: {
		what: 'Auf „E-Mails" die Primuss-Daten an alle Prüfenden verschicken.',
		why: 'Jede:r Prüfende bekommt die Anmeldungen zur eigenen Prüfung und kann melden, wenn etwas nicht stimmt.',
		note: 'Die Sammel-E-Mail geht nur einmal raus; für eine einzelne Prüfung lässt sie sich jederzeit erneut senden.'
	},
	ntaRoomAloneSent: {
		what: 'Auf „E-Mails" die Info an Studierende mit Nachteilsausgleich und Anspruch auf einen eigenen Raum verschicken.',
		why: 'Die Betroffenen und ihre Prüfenden erfahren früh, für welche Prüfungen ein eigener Raum eingeplant wird.'
	},

	// --- Phase 1 ---
	otherFKExamsScheduled: {
		what: 'Auf „Prüfungen anderer FKs" die Termine eintragen, die die anderen Fakultäten für ihre Prüfungen festgelegt haben.',
		why: 'Diese Termine sind für uns fest. Der Generator plant unsere Prüfungen um sie herum.',
		note: 'Das Häkchen setzt sich von selbst, sobald alle diese Prüfungen einen Termin haben.'
	},
	exahmSebPlanned: {
		what: 'Auf „EXaHM/SEB in T-Bau planen" erst einen Probelauf starten und dann mit „Planen & schreiben" übernehmen.',
		why: 'Die Rechnerprüfungen kommen zuerst dran, weil sie nur in die gebuchten T-Bau-Zeiten passen.'
	},
	exahmSebFixed: {
		what: 'Auf derselben Seite „EXaHM/SEB fixieren".',
		why: 'Fixierte Prüfungen behalten ihren Termin, wenn danach der große Terminplan generiert wird.'
	},
	examScheduleGenerated: {
		what: 'Auf „Terminplan generieren" erst einen Probelauf starten, das Ergebnis ansehen und dann mit „Generieren & schreiben" speichern.',
		why: 'Der Generator verteilt alle übrigen Prüfungen so, dass möglichst wenige Studierende zwei Prüfungen gleichzeitig oder am selben Tag haben.',
		note: 'Danach auf „Prüfungsplan" nachbessern und auf „Terminplanung validieren" prüfen.'
	},
	draftSent: {
		what: 'Auf „E-Mails" den Entwurf des Terminplans an die Prüfenden verschicken.',
		why: 'Die Prüfenden können Einwände melden, bevor der Plan verbindlich wird.',
		note: 'Ab hier ist das Neu-Generieren des Terminplans gesperrt. Änderungen von Hand bleiben möglich.'
	},
	examPlanPublished: {
		what: 'Nach der Abstimmung den Terminplan ins ZPA übertragen und auf „E-Mails" die Veröffentlichung verschicken.',
		why: 'Damit ist der Terminplan offiziell.',
		note: '„Veröffentlicht" heißt hier: die E-Mail ist verschickt. Das Übertragen ins ZPA ist ein eigener Schritt und bleibt immer möglich.'
	},

	// --- Phase 2 ---
	roomRequestsSent: {
		what: 'Auf „Raum-Anfragen (Gebäudemanagement)" den Probelauf ansehen, übernehmen und die Anfrage-E-Mail verschicken.',
		why: 'Große Räume wie der Rote Würfel gehören nicht der Fakultät und müssen für die Prüfungszeiten angefragt werden.',
		note: 'Kommt die Genehmigung, wird sie auf derselben Seite je Anfrage eingetragen.'
	},
	roomsAssigned: {
		what: 'Auf „Räume generieren" erst einen Probelauf starten und dann mit „Generieren & schreiben" speichern.',
		why: 'Plexams verteilt alle Studierenden auf die verfügbaren Räume und berücksichtigt dabei Nachteilsausgleiche und Raumanforderungen.',
		note: 'Räume hängen an der Prüfung. Wird eine Prüfung danach verschoben, müssen die Räume neu generiert werden.'
	},
	secretariatRoomsSent: {
		what: 'Auf „E-Mails" die Raumbelegung ans Sekretariat verschicken.',
		why: 'Das Sekretariat erfährt, welche Räume wann für Prüfungen belegt sind.'
	},
	roomPlanPublished: {
		what: 'Den Plan mit Räumen ins ZPA übertragen und auf „E-Mails" die Veröffentlichung verschicken.',
		why: 'Damit ist der Raumplan offiziell.',
		note: 'Ab hier ist das Neu-Generieren der Räume gesperrt. Einzelne Räume lassen sich weiter von Hand ändern.'
	},
	kdpRoomsSent: {
		what: 'Auf „E-Mails" die Raumübersicht der EXaHM- und SEB-Prüfungen ans KDP (Kompetenzzentrum Digitales Prüfen) verschicken.',
		why: 'Das KDP betreut die Rechnerprüfungen und muss wissen, welche Prüfung wann in welchem Raum stattfindet.'
	},

	// --- Phase 3 ---
	invigilationsRequested: {
		what: 'Im ZPA das Formular für die Aufsichts-Anforderungen freischalten und auf „E-Mails" die Aufforderung verschicken.',
		why: 'Die Aufsichtführenden tragen ein, an welchen Tagen sie nicht können und was sonst zu beachten ist.'
	},
	invigReqsImported: {
		what: 'Nach Ablauf der Frist auf „ZPA-Import & Veröffentlichung" die Aufsichts-Anforderungen laden.',
		why: 'Die Einteilung hält sich an diese Angaben.',
		note: 'Wer nichts eingetragen hat, bekommt auf „E-Mails" eine Erinnerung. Danach noch einmal laden.'
	},
	invigilationsAssigned: {
		what: 'Auf „Aufsichten einteilen" erst einen Probelauf starten und dann die Einteilung speichern.',
		why: 'Plexams verteilt die Aufsichten so, dass jede:r etwa so viele Minuten leistet wie vorgesehen und niemand an zu vielen Tagen kommen muss.'
	},
	invigilationPlanPublished: {
		what: 'Den Plan mit Aufsichten ins ZPA übertragen und auf „E-Mails" die Veröffentlichung verschicken.',
		why: 'Jede:r Aufsichtführende bekommt den persönlichen Plan.',
		note: 'Ab hier ist das Neu-Einteilen gesperrt. Einzelne Aufsichten lassen sich weiter von Hand ändern.'
	},
	invigSecretariatSent: {
		what: 'Auf „E-Mails" die Info „Aufsichten veröffentlicht" ans Sekretariat verschicken.',
		why: 'Das Sekretariat weiß damit, dass der Aufsichtenplan steht.'
	},
	ntaPlannedSent: {
		what: 'Auf „E-Mails" die Info an die Studierenden mit Nachteilsausgleich zu ihren Räumen verschicken.',
		why: 'Die Betroffenen erfahren, in welchem Raum sie welche Prüfung schreiben.'
	},
	lbaRepeatersSent: {
		what: 'Auf „E-Mails" die Übersicht der Wiederholungsprüfungen von Lehrbeauftragten verschicken.',
		why: 'Die für Lehrbeauftragte zuständige Stelle der Fakultät bekommt damit die Termine und Aufsichten dieser Prüfungen.'
	},
	coverPagesSent: {
		what: 'Auf „E-Mails" die Deckblätter an alle Prüfenden verschicken.',
		why: 'Jede:r Prüfende bekommt die Deckblätter für die eigenen Prüfungen als Anhang.',
		note: 'Das ist der letzte Schritt der Planung.'
	}
};

/**
 * The explanation for a checklist step, if there is one.
 * @param {string} key condition key
 * @returns {StepHelp | undefined}
 */
export function stepHelp(key) {
	return STEP_HELP[key];
}
