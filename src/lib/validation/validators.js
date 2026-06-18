// Definitionen der einzelnen Validatoren, je eine GraphQL-Subscription.
// `key` ist der Subscription-Feldname, `title`/`description` die Anzeige.
// Neue Validierungs-Gruppen werden hier ergänzt und in die jeweiligen Seiten
// (sowie die Gesamtseite /validate) eingebunden.

/**
 * @typedef {{ key: string, title: string, description: string }} ValidatorDef
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
		key: 'validateRoomsTimeDistance',
		title: 'Zeitabstände',
		description: 'Abstände zwischen Räumen'
	}
];
