// Definitionen der E-Mail-Versand-Typen. Jeder Eintrag entspricht einer
// GraphQL-Subscription des Backends (Feldname = `key`), die LogLines streamt
// und mit einer DONE-Zeile endet — exakt wie die Validierungs-/Generierungs-
// Subscriptions. Argument jeder Subscription: `run: Boolean!`
// (false = Probelauf: alle Mails gebündelt als .eml-Anhänge an die Testadresse;
// true = wirklich versenden).
//
// Versände mit Anhängen (Deckblätter, Aufsichtskalender) tragen zusätzlich
// `links` auf die Seiten, wo Upload/Einzelversand/Erzeugung passieren.
// Noch NICHT angeboten (Backend folgt später): primuss-data, nta-*.

/**
 * @typedef {{ href: string, label: string, primary?: boolean }} EmailLink
 * @typedef {{ key: string, title: string, description: string, links?: EmailLink[], extraArgs?: Record<string, { type: string, value: any }>, conditionKey?: string }} EmailDef
 * @typedef {{ id: string, title: string, emails: EmailDef[] }} EmailGroup
 */

/** @type {EmailDef[]} */
export const previousSemesterEmails = [
	{
		key: 'sendEmailExaHM',
		title: 'EXaHM / SEB',
		description: 'Information zu den Computer-Prüfungen (EXaHM / SEB)'
	}
];

/** @type {EmailDef[]} */
export const constraintEmails = [
	{
		key: 'sendEmailConstraints',
		title: 'Constraints / Wünsche',
		description: 'Aufforderung an die Prüfenden, ihre Constraints und Wünsche zu melden'
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
	},
	{
		key: 'sendEmailPublishedExams',
		title: 'Veröffentlichte Termine',
		description: 'Die endgültig veröffentlichten Prüfungstermine'
	}
];

/** @type {EmailDef[]} */
export const roomEmails = [
	{
		key: 'sendEmailRoomsSecretariat',
		title: 'Räume ans Sekretariat',
		description: 'Die Raumplanung ans Sekretariat senden (vor der Veröffentlichung)'
	},
	{
		key: 'sendEmailPublishedRooms',
		title: 'Veröffentlichte Räume',
		description: 'Die endgültig veröffentlichte Raumplanung'
	},
	{
		key: 'sendEmailKdpExahm',
		title: 'KDP / EXaHM',
		description: 'CSV der Computer-Prüfungen (EXaHM/SEB) ans KDP — Anhang serverseitig erzeugt'
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
	},
	{
		key: 'sendEmailPublishedInvigilations',
		title: 'Veröffentlichte Aufsichten',
		description:
			'Je Aufsicht eine Mail mit ihrem Aufsichtskalender (PNG); fehlende erscheinen als WARN-Zeile. Die Kalender werden auf „Aufsichten mit Anforderungen“ erzeugt & hochgeladen.',
		links: [
			{ href: '/email/attachments', label: '→ Anhänge: Kalender' },
			{ href: '/plan/invigilation/planning', label: '→ Aufsichten mit Anforderungen' }
		]
	},
	{
		key: 'sendEmailInvigilationsSecretariat',
		title: 'Aufsichten ans Sekretariat',
		description: 'Die veröffentlichte Aufsichtenplanung ans Sekretariat'
	},
	{
		key: 'sendEmailLbaRepeaters',
		title: 'LBA-Wiederholungsprüfungen',
		description: 'Info zu den Wiederholungsprüfungen der Lehrbeauftragten (an emails.lbaba)'
	}
];

/** @type {EmailDef[]} */
export const primussEmails = [
	{
		key: 'sendEmailPrimussDataAll',
		title: 'Primuss-Daten (alle)',
		description: 'Primuss-Prüfungsdaten an alle zuständigen Stellen. Einzelversand siehe unten.'
	},
	{
		key: 'sendEmailNTARoomAlone',
		title: 'NTA Einzelraum (alle)',
		description: 'Info zu allen NTAs mit eigenem Raum. Einzelversand siehe unten.',
		extraArgs: { mtknr: { type: 'String!', value: 'all' } },
		conditionKey: 'ntaRoomAloneSent'
	}
];

/** @type {EmailDef[]} */
export const ntaEmails = [
	{
		key: 'sendEmailNTAPlanned',
		title: 'NTA verplant',
		description: 'Info an die Prüfenden, dass die NTAs eingeplant sind.'
	}
];

/** @type {EmailDef[]} */
export const coverPageEmails = [
	{
		key: 'sendEmailCoverPages',
		title: 'Deckblätter (alle)',
		description:
			'Deckblatt-PDFs an alle Prüfenden mit von mir geplanten Prüfungen. Hochladen (ZIP oder einzeln), Status-Abgleich und Einzelversand auf der Anhänge-Seite.',
		links: [
			{ href: '/email/attachments', label: '→ Anhänge: Deckblätter (hochladen & einzeln senden)' }
		]
	}
];

// Kanonische Reihenfolge der Gruppen für die Übersichtsseite /email
// (Workflow-Reihenfolge; Deckblätter ganz am Ende).
/** @type {EmailGroup[]} */
export const emailGroups = [
	{ id: 'previousSemester', title: 'noch im vorherigen Semester', emails: previousSemesterEmails },
	{ id: 'constraints', title: 'Vorbereitung', emails: constraintEmails },
	{ id: 'primuss', title: 'Primuss', emails: primussEmails },
	{ id: 'planning', title: 'Planung', emails: planningEmails },
	{ id: 'rooms', title: 'Räume', emails: roomEmails },
	{ id: 'invigilation', title: 'Aufsichten', emails: invigilationEmails },
	{ id: 'nta', title: 'NTA', emails: ntaEmails },
	{ id: 'coverpages', title: 'Deckblätter', emails: coverPageEmails }
];
