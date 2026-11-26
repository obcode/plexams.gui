// Definitionen der einzelnen Validatoren, je eine GraphQL-Subscription.
// `key` ist der Subscription-Feldname, `title`/`description` die Anzeige.
// Neue Validierungs-Gruppen werden hier ergänzt und in die jeweiligen Seiten
// (sowie die Gesamtseite /validate) eingebunden.

/**
 * @typedef {{ name: string, type: string, value: any }} ArgSpec
 * @typedef {{ endpoint: string, field: string }} QuerySpec
 *   Nicht-streamender Validator: statt einer LogLine-Subscription wird eine
 *   GraphQL-Query über den /api-Proxy `endpoint` (POST) abgefragt und das Feld
 *   `field` der Antwort (eine graduierte `{ ok, findings, messages }`-Struktur)
 *   in einen ValidationReport übersetzt.
 * @typedef {{ key: string, title: string, description: string, argSpec?: ArgSpec[], query?: QuerySpec }} ValidatorDef
 */

/** @type {ValidatorDef[]} */
export const invigilationValidators = [
	{
		key: 'validateInvigilatorRequirements',
		title: 'Sperrtage & eigene Prüfungen',
		description:
			'Niemand hat Aufsicht an einem Sperrtag, zwei Aufsichten gleichzeitig oder Reserveaufsicht während der eigenen Prüfung.'
	},
	{
		key: 'validateInvigilationDuplicates',
		title: 'Doppelbesetzungen',
		description: 'Kein Raum und keine Reserve ist doppelt besetzt.'
	},
	{
		key: 'validateInvigilatorSlots',
		title: 'Offene Aufsichten',
		description: 'Je Tag: Räume ohne Aufsicht und Prüfungszeiten ohne Reserve.'
	},
	{
		key: 'validateInvigilationsTimeDistance',
		title: 'Zeit zwischen Aufsichten',
		description: 'Zwischen zwei Aufsichten derselben Person liegt genug Zeit.'
	},
	{
		key: 'validateInvigilationConstraints',
		title: 'Vorgaben der Einteilung',
		description:
			'Verfügbarkeit, Zeitfenster und vorgeplante Aufsichten sind eingehalten; die Last ist gleichmäßig verteilt.'
	}
];

/**
 * @typedef {{ id: string, title: string, validators: ValidatorDef[] }} ValidatorGroup
 */

/** @type {ValidatorDef[]} */
export const roomValidators = [
	{
		key: 'validateRoomsPerSlot',
		title: 'Räume je Prüfungszeit',
		description: 'Nur zu dieser Zeit erlaubte Räume, kein Raum überbelegt, niemand ohne Platz.'
	},
	{
		key: 'validateRoomsNeedRequest',
		title: 'Raum-Anfragen',
		description:
			'Für jeden Raum, der angefragt werden muss, gibt es eine Anfrage. Fehlt sie: Fehler. Noch nicht genehmigt: Warnung.'
	},
	{
		key: 'validateRoomsPerExam',
		title: 'Räume je Prüfung',
		description:
			'Jede:r hat einen Platz, der Raum passt zu den Vorgaben der Prüfung, und wer Anspruch auf einen eigenen Raum hat, sitzt allein.'
	},
	{
		key: 'validateRoomsEnoughSeats',
		title: 'Platzreserve',
		description: 'In den Räumen bleiben genug Plätze als Reserve frei.'
	},
	{
		key: 'validateRoomsTimeDistance',
		title: 'Zeit zwischen Prüfungen',
		description: 'Zwischen zwei Prüfungen im selben Raum liegt genug Zeit.'
	},
	{
		key: 'validateRoomsBlocked',
		title: 'Gesperrte Räume',
		description: 'Kein gesperrter Raum ist noch verplant.'
	}
];

/** @type {ValidatorDef[]} */
export const schedulingValidators = [
	{
		key: 'validateConflicts',
		title: 'Konflikte',
		description:
			'Studierende mit zwei Prüfungen zur selben Zeit, zu dicht nacheinander oder am selben Tag.',
		argSpec: [
			{ name: 'onlyPlannedByMe', type: 'Boolean!', value: true },
			{ name: 'ancode', type: 'Int!', value: 0 }
		]
	},
	{
		key: 'validateConstraints',
		title: 'Vorgaben',
		description:
			'Feste Termine, ausgeschlossene Tage, „gleichzeitig“ und Raumanforderungen sind eingehalten.'
	},
	{
		key: 'validateSemesterTimes',
		title: 'Tageszeiten',
		description:
			'Die Startzeiten liegen im Tageszeit-Fenster, das die Semester-Konfiguration vorgibt.'
	}
];

// SEB/EXaHM-Vorplanung (Phase -1, ganz am Anfang, vor der Raumplanung). Prüft
// nur die Vorplanungs-Prüfungen (preplan_exams), ohne ZPA-Exams. Kein Streaming:
// die Query validatePreplanAssignment liefert direkt graduierte findings.
/** @type {ValidatorDef[]} */
export const preplanValidators = [
	{
		key: 'validatePreplanAssignment',
		title: 'Verteilung',
		description:
			'Jede vorgeplante Rechnerprüfung passt in eine gebuchte Zeit und in die gebuchten Räume.',
		query: {
			endpoint: '/api/preplan/validatePreplanAssignment',
			field: 'validatePreplanAssignment'
		}
	}
];

// Primuss-Anmeldungen: Studierende mit Anmeldungen in mehreren Studiengängen
// (rein informativ). Eigener Validierungspunkt.
/** @type {ValidatorDef[]} */
export const primussValidators = [
	{
		key: 'validateStudentRegs',
		title: 'Mehrere Studiengänge',
		description: 'Studierende, die in mehreren Studiengängen angemeldet sind. Nur zur Kenntnis.'
	}
];

// Interne DB-Konsistenz, aufgeteilt in fünf Teilprüfungen (ersetzt die frühere
// einzelne validateDB-Subscription).
/** @type {ValidatorDef[]} */
export const dbValidators = [
	{
		key: 'validateDBPlanEntries',
		title: 'Termine',
		description:
			'Jeder gespeicherte Termin gehört zu einer aufbereiteten Prüfung und liegt auf einer erlaubten Startzeit.'
	},
	{
		key: 'validateDBConstraints',
		title: 'Vorgaben',
		description:
			'Gespeicherte Vorgaben gehören zu einer Prüfung; feste Tage stimmen mit dem Termin überein.'
	},
	{
		key: 'validateDBRooms',
		title: 'Räume',
		description: 'Gespeicherte Räume passen zu Termin, Stammdaten und Anmeldungen.'
	},
	{
		key: 'validateDBNtas',
		title: 'Nachteilsausgleiche',
		description: 'Nachteilsausgleiche sind vollständig, eindeutig und greifen bei den Anmeldungen.'
	},
	{
		key: 'validateDBReferences',
		title: 'Verweise',
		description:
			'Abweichende Dauern, Freigaben, Anmeldezahlen und Verknüpfungen zeigen auf vorhandene Prüfungen.'
	}
];

// Kanonische Reihenfolge/Registry aller Gruppen für die Gesamtseite /validate
// und den Status-Indikator in der Nav. Weitere Gruppen hier ergänzen.
/** @type {ValidatorGroup[]} */
export const validationGroups = [
	{ id: 'db', title: 'Stimmigkeit der Daten', validators: dbValidators },
	{ id: 'preplan', title: 'SEB/EXaHM-Vorplanung', validators: preplanValidators },
	{ id: 'primuss', title: 'Anmeldungen', validators: primussValidators },
	{ id: 'scheduling', title: 'Terminplanung', validators: schedulingValidators },
	{ id: 'rooms', title: 'Räume', validators: roomValidators },
	{ id: 'invigilation', title: 'Aufsichten', validators: invigilationValidators }
];

// ZPA-Validatoren: bewusst NICHT in validationGroups, damit sie weder die
// Gesamtseite /validate noch die allgemeine Nav-Ampel beeinflussen. Sie haben
// eine eigene Ampel und starten nur auf Klick.
/** @type {ValidatorDef[]} */
export const zpaValidators = [
	{
		key: 'validateZPADateTimes',
		title: 'Termine',
		description: 'Im ZPA stehen dieselben Termine wie in Plexams.'
	},
	{
		key: 'validateZPARooms',
		title: 'Räume',
		description: 'Im ZPA stehen dieselben Räume wie in Plexams.'
	},
	{
		key: 'validateZPAInvigilators',
		title: 'Aufsichten',
		description: 'Im ZPA stehen dieselben Aufsichten wie in Plexams.'
	}
];

/** @type {ValidatorGroup} */
export const zpaGroup = { id: 'zpa', title: 'ZPA', validators: zpaValidators };
