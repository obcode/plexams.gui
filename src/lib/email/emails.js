// Definitionen der E-Mail-Versand-Typen. Jeder Eintrag entspricht einer
// GraphQL-Subscription des Backends (Feldname = `key`), die LogLines streamt
// und mit einer DONE-Zeile endet — exakt wie die Validierungs-/Generierungs-
// Subscriptions. Argument jeder Subscription: `run: Boolean!`
// (false = Probelauf, mailt nur an den Planer; true = wirklich versenden).
//
// Noch NICHT angeboten (Backend folgt in späteren Phasen): cover-pages,
// primuss-data, nta-*, published-invigilations.

/**
 * @typedef {{ key: string, title: string, description: string }} EmailDef
 * @typedef {{ id: string, title: string, emails: EmailDef[] }} EmailGroup
 */

/** @type {EmailDef[]} */
export const constraintEmails = [
	{
		key: 'sendEmailConstraints',
		title: 'Constraints / Wünsche',
		description: 'Aufforderung an die Prüfenden, ihre Constraints und Wünsche zu melden'
	},
	{
		key: 'sendEmailExaHM',
		title: 'EXaHM / SEB',
		description: 'Information zu den Computer-Prüfungen (EXaHM / SEB)'
	},
	{
		key: 'sendEmailPrepared',
		title: 'Vorbereitete Prüfungen',
		description: 'Rückmeldung zu den vorbereiteten, zu planenden Prüfungen'
	}
];

/** @type {EmailDef[]} */
export const planningEmails = [
	{
		key: 'sendEmailDraft',
		title: 'Planentwurf',
		description: 'Entwurf des Prüfungsplans zur Kontrolle an die Prüfenden'
	}
];

/** @type {EmailDef[]} */
export const publishedEmails = [
	{
		key: 'sendEmailPublishedExams',
		title: 'Veröffentlichte Termine',
		description: 'Die endgültig veröffentlichten Prüfungstermine'
	},
	{
		key: 'sendEmailPublishedRooms',
		title: 'Veröffentlichte Räume',
		description: 'Die endgültig veröffentlichte Raumplanung'
	},
	{
		key: 'sendEmailPublishedInvigilations',
		title: 'Veröffentlichte Aufsichten',
		description:
			'Je Aufsicht eine Mail mit ihrem Aufsichtskalender (PNG). Vorher die Kalender unter „Anhänge“ hochladen; fehlende erscheinen als WARN-Zeile.'
	}
];

/** @type {EmailDef[]} */
export const coverPageEmails = [
	{
		key: 'sendEmailCoverPages',
		title: 'Deckblätter (alle)',
		description:
			'Deckblatt-PDFs an alle Prüfenden mit von mir geplanten Prüfungen. Vorher die PDFs unter „Anhänge“ hochladen. Einzelversand auf der Anhänge-Seite.'
	}
];

/** @type {EmailDef[]} */
export const invigilationEmails = [
	{
		key: 'sendEmailInvigilations',
		title: 'Anforderungen für Aufsichten',
		description: 'Aufforderung an die Aufsichten ihre Anforderungen einzutragen'
	},
	{
		key: 'sendEmailInvigilationsMissing',
		title: 'Fehlende Anforderungen für Aufsichten',
		description: 'Erinnerung an noch nicht eingetragene / fehlende Anforderungen an die Aufsichten'
	}
];

// Kanonische Reihenfolge der Gruppen für die Übersichtsseite /email.
/** @type {EmailGroup[]} */
export const emailGroups = [
	{ id: 'constraints', title: 'Vorbereitung', emails: constraintEmails },
	{ id: 'planning', title: 'Planung', emails: planningEmails },
	{ id: 'coverpages', title: 'Deckblätter', emails: coverPageEmails },
	{ id: 'published', title: 'Veröffentlichung', emails: publishedEmails },
	{ id: 'invigilation', title: 'Aufsichten', emails: invigilationEmails }
];
