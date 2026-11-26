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
		description:
			'Fragt den Bedarf an EXaHM- und SEB-Prüfungen ab, mit Link auf das Portal, solange die Abfrage offen ist. Geht an die Adresse „Profs“ aus der Semester-Konfiguration.'
	}
];

// „Vorbereitung": Die früheren Einzelversände „Constraints/Wünsche" und
// „Vorbereitete Prüfungen" sind entfallen (Subscriptions gibt es nicht mehr);
// ersetzt durch den kombinierten Versand mit Empfänger-Auswahl
// (ExamPlanningInfoSender → sendEmailExamPlanningInfo), der auf /email für diese
// Gruppe gerendert wird.
/** @type {EmailDef[]} */
export const constraintEmails = [];

/** @type {EmailDef[]} */
export const planningEmails = [
	{
		key: 'sendEmailDraft',
		title: 'Planentwurf',
		description:
			'Kündigt den Entwurf des Prüfungsplans zur Kontrolle an. Geht an „Profs“, „LBAs“, „LBAs (letztes Sem.)“ und die zusätzlichen Prüfenden; die Fachschaft bekommt eine eigene E-Mail.'
	},
	{
		key: 'sendEmailPublishedExams',
		title: 'Veröffentlichte Termine',
		description:
			'Kündigt die veröffentlichten Prüfungstermine an. Geht an „Profs“, „LBAs“, „LBAs (letztes Sem.)“, die Fachschaft und die zusätzlichen Prüfenden.'
	}
];

/** @type {EmailDef[]} */
export const roomEmails = [
	{
		key: 'sendEmailRoomsSecretariat',
		title: 'Räume ans Sekretariat',
		description:
			'Schickt dem Sekretariat, welche eigenen Räume wann für Prüfungen belegt sind (vor der Veröffentlichung); angefragte Räume des Gebäudemanagements sind nicht dabei.'
	},
	{
		key: 'sendEmailPublishedRooms',
		title: 'Veröffentlichte Räume',
		description: 'Schickt jeder Prüferin und jedem Prüfer die Räume der eigenen Prüfungen.'
	},
	{
		key: 'sendEmailKdpExahm',
		title: 'KDP / EXaHM',
		description:
			'Schickt dem KDP die Raumübersicht der EXaHM- und SEB-Prüfungen als CSV-Anhang (erzeugt Plexams selbst); die Prüfenden dieser Prüfungen stehen in Cc.'
	}
];

/** @type {EmailDef[]} */
export const invigilationEmails = [
	{
		key: 'sendEmailInvigilations',
		title: 'Anforderungen für Aufsichten',
		description:
			'Fordert dazu auf, im ZPA die Aufsichts-Anforderungen (Sperrtage usw.) einzutragen. Geht an „Profs“.'
	},
	{
		key: 'sendEmailInvigilationsMissing',
		title: 'Fehlende Anforderungen für Aufsichten',
		description: 'Erinnert jede Aufsichtsperson einzeln, die im ZPA noch nichts eingetragen hat.'
	},
	{
		key: 'sendEmailPublishedInvigilations',
		title: 'Veröffentlichte Aufsichten',
		description:
			'Schickt jeder Aufsichtsperson ihren persönlichen Aufsichtsplan als Bild und Kalenderdatei. Wem das Bild fehlt, der wird im Verlauf als Warnung genannt; die Bilder erzeugst und lädst du unter „Aufsichten mit Anforderungen“ hoch.',
		links: [
			{ href: '/email/attachments', label: '→ Anhänge: Kalender' },
			{ href: '/plan/invigilation/planning', label: '→ Aufsichten mit Anforderungen' }
		]
	},
	{
		key: 'sendEmailInvigilationsSecretariat',
		title: 'Aufsichten ans Sekretariat',
		description: 'Teilt dem Sekretariat mit, dass der Aufsichtenplan veröffentlicht ist.'
	},
	{
		key: 'sendEmailLbaRepeaters',
		title: 'LBA-Wiederholungsprüfungen',
		description:
			'Schickt die Termine und Aufsichten der Wiederholungsprüfungen von Lehrbeauftragten an die Adresse „LBA-Beauftragte:r“.'
	}
];

/** @type {EmailDef[]} */
export const primussEmails = [
	{
		key: 'sendEmailPrimussDataAll',
		title: 'Primuss-Daten (alle)',
		description:
			'Schickt jeder Prüferin und jedem Prüfer die Anmeldedaten aus Primuss zu den eigenen Prüfungen; Prüfungen anderer Fakultäten werden übersprungen. Einzelversand siehe unten.'
	},
	{
		key: 'sendEmailNTARoomAlone',
		title: 'NTA: eigener Raum (alle)',
		description:
			'Schreibt allen Studierenden mit Anspruch auf einen eigenen Raum; die Prüfenden ihrer Prüfungen stehen in Cc. Einzelversand siehe unten.',
		extraArgs: { mtknr: { type: 'String!', value: 'all' } },
		conditionKey: 'ntaRoomAloneSent'
	}
];

/** @type {EmailDef[]} */
export const ntaEmails = [
	{
		key: 'sendEmailNTAPlanned',
		title: 'NTA: Räume mitteilen',
		description:
			'Schreibt allen Studierenden mit Nachteilsausgleich, in welchem Raum sie welche Prüfung schreiben. Fehlt bei einer Person die E-Mail-Adresse, geht nichts raus.'
	}
];

/** @type {EmailDef[]} */
export const coverPageEmails = [
	{
		key: 'sendEmailCoverPages',
		title: 'Deckblätter (alle)',
		description:
			'Schickt allen Prüfenden unserer Prüfungen ihre Deckblätter als PDF. Hochladen (ZIP oder einzeln), Abgleich und Einzelversand unter „E-Mail-Anhänge“.',
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
