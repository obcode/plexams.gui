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
		title: 'Anforderungen',
		description: 'Aufsichts-Anforderungen erfüllt'
	},
	{
		key: 'validateInvigilationDuplicates',
		title: 'Doppelbelegungen',
		description: 'keine doppelten Aufsichten'
	},
	{
		key: 'validateInvigilatorSlots',
		title: 'Slots',
		description: 'Aufsichten in gültigen Slots'
	},
	{
		key: 'validateInvigilationsTimeDistance',
		title: 'Zeitabstände',
		description: 'Abstände zwischen Aufsichten'
	},
	{
		key: 'validateInvigilationConstraints',
		title: 'Constraints',
		description: 'Constraints eingehalten'
	}
];

/**
 * @typedef {{ id: string, title: string, validators: ValidatorDef[] }} ValidatorGroup
 */

/** @type {ValidatorDef[]} */
export const roomValidators = [
	{
		key: 'validateRoomsPerSlot',
		title: 'Räume pro Slot',
		description: 'Räume nicht doppelt belegt'
	},
	{
		key: 'validateRoomsNeedRequest',
		title: 'Reservierungen',
		description: 'nicht-genehmigte → Warnung, fehlende → Fehler'
	},
	{
		key: 'validateRoomsPerExam',
		title: 'Räume pro Prüfung',
		description: 'Sitzplätze, Raum-Constraints, NTA-allein'
	},
	{
		key: 'validateRoomsEnoughSeats',
		title: 'Genügend freie Plätze',
		description: 'genug freie Plätze in den Slots'
	},
	{
		key: 'validateRoomsTimeDistance',
		title: 'Zeitabstände',
		description: 'Abstände zwischen Räumen'
	},
	{
		key: 'validateRoomsBlocked',
		title: 'Blockierte Räume',
		description: 'gesperrter Raum noch verplant → neu generieren'
	}
];

/** @type {ValidatorDef[]} */
export const schedulingValidators = [
	{
		key: 'validateConflicts',
		title: 'Konflikte',
		description: 'Konflikte im Zeitplan',
		argSpec: [
			{ name: 'onlyPlannedByMe', type: 'Boolean!', value: true },
			{ name: 'ancode', type: 'Int!', value: 0 }
		]
	},
	{
		key: 'validateConstraints',
		title: 'Constraints',
		description: 'Constraints im Zeitplan eingehalten'
	}
];

// SEB/EXaHM-Vorplanung (Phase -1, ganz am Anfang, vor der Raumplanung). Prüft
// nur die Vorplanungs-Prüfungen (preplan_exams), ohne ZPA-Exams. Kein Streaming:
// die Query validatePreplanAssignment liefert direkt graduierte findings.
/** @type {ValidatorDef[]} */
export const preplanValidators = [
	{
		key: 'validatePreplanAssignment',
		title: 'Zuordnung',
		description: 'SEB/EXaHM-Vorplanung: Preplan-Prüfungen in Slots/Räume',
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
		title: 'Anmeldungen',
		description: 'Studierende mit Regs in mehreren Programmen (Info)'
	}
];

// Interne DB-Konsistenz, aufgeteilt in fünf Teilprüfungen (ersetzt die frühere
// einzelne validateDB-Subscription).
/** @type {ValidatorDef[]} */
export const dbValidators = [
	{
		key: 'validateDBPlanEntries',
		title: 'Planeinträge',
		description: 'Planeinträge konsistent'
	},
	{
		key: 'validateDBConstraints',
		title: 'Constraints',
		description: 'Constraints konsistent'
	},
	{
		key: 'validateDBRooms',
		title: 'Räume',
		description: 'Raumdaten konsistent'
	},
	{
		key: 'validateDBNtas',
		title: 'NTAs',
		description: 'Nachteilsausgleiche konsistent'
	},
	{
		key: 'validateDBReferences',
		title: 'Referenzen',
		description: 'Verweise zwischen Datensätzen konsistent'
	}
];

// Kanonische Reihenfolge/Registry aller Gruppen für die Gesamtseite /validate
// und den Status-Indikator in der Nav. Weitere Gruppen hier ergänzen.
/** @type {ValidatorGroup[]} */
export const validationGroups = [
	{ id: 'db', title: 'Datenbank-Integrität', validators: dbValidators },
	{ id: 'preplan', title: 'SEB/EXaHM-Vorplanung', validators: preplanValidators },
	{ id: 'primuss', title: 'Primuss', validators: primussValidators },
	{ id: 'scheduling', title: 'Terminplanung', validators: schedulingValidators },
	{ id: 'rooms', title: 'Räume', validators: roomValidators },
	{ id: 'invigilation', title: 'Aufsichten', validators: invigilationValidators }
];

// ZPA-Validatoren: bewusst NICHT in validationGroups, damit sie weder die
// Gesamtseite /validate noch die allgemeine Nav-Ampel beeinflussen. Sie haben
// eine eigene Ampel und starten nur auf Klick.
/** @type {ValidatorDef[]} */
export const zpaValidators = [
	{ key: 'validateZPADateTimes', title: 'Termine', description: 'Datum/Uhrzeit im ZPA' },
	{ key: 'validateZPARooms', title: 'Räume', description: 'Räume im ZPA' },
	{ key: 'validateZPAInvigilators', title: 'Aufsichten', description: 'Aufsichten im ZPA' }
];

/** @type {ValidatorGroup} */
export const zpaGroup = { id: 'zpa', title: 'ZPA', validators: zpaValidators };
