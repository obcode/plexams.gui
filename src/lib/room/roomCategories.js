// Farbliche Kategorisierung der in einer Prüfung geplanten Räume — für den
// schnellen Überblick in der Raumplanung („nach Prüfungen"). Bewusst feste
// Farben (kein Theme-Token), weil sie an physische Räume gekoppelt sind
// (R1.046 = „roter Würfel", R1.049 = „blaue Tonne"). Die vollständigen
// Klassen-Strings stehen als Literale hier, damit Tailwind sie erfasst.

/**
 * @typedef {{ key: string, label: string, chip: string, swatch: string }} RoomCategory
 */

/** @type {RoomCategory[]} */
export const ROOM_CATEGORIES = [
	{
		key: 'noroom',
		label: 'kein Raum!',
		chip: 'border-error bg-error text-error-content',
		swatch: 'bg-error'
	},
	{
		key: 'red',
		label: 'R1.046 (roter Würfel)',
		chip: 'border-red-400 bg-red-200 text-red-900',
		swatch: 'bg-red-400'
	},
	{
		key: 'blue',
		label: 'R1.049 (blaue Tonne)',
		chip: 'border-blue-400 bg-blue-200 text-blue-900',
		swatch: 'bg-blue-400'
	},
	{
		key: 'nta',
		label: 'NTA-Raum',
		chip: 'border-purple-400 bg-purple-100 text-purple-900',
		swatch: 'bg-purple-400'
	},
	{
		key: 'lab',
		label: 'Labor',
		chip: 'border-amber-400 bg-amber-100 text-amber-900',
		swatch: 'bg-amber-400'
	},
	{
		key: 'anny',
		label: 'Anny-Anforderung',
		chip: 'border-teal-400 bg-teal-100 text-teal-900',
		swatch: 'bg-teal-400'
	},
	{
		key: 'mgmt',
		label: 'Geb.management-Anforderung',
		chip: 'border-orange-400 bg-orange-100 text-orange-900',
		swatch: 'bg-orange-400'
	},
	{
		key: 'online',
		label: 'online',
		chip: 'border-green-400 bg-green-100 text-green-900',
		swatch: 'bg-green-400'
	},
	{
		key: 'default',
		label: 'Standardraum',
		chip: 'border-base-300 bg-base-200 text-base-content',
		swatch: 'bg-base-300'
	}
];

const byKey = Object.fromEntries(ROOM_CATEGORIES.map((c) => [c.key, c]));

/**
 * Kategorie eines geplanten Raums (PlannedRoom mit .room und .handicap).
 * Reihenfolge: konkrete Raumnamen vor allgemeinen Kriterien.
 * @param {any} pr
 * @returns {RoomCategory}
 */
export function classifyRoom(pr) {
	const r = pr.room || {};
	if (r.name === 'No Room') return byKey.noroom;
	if (r.name === 'ONLINE') return byKey.online;
	if (r.name === 'R1.046') return byKey.red;
	if (r.name === 'R1.049') return byKey.blue;
	if (pr.handicap) return byKey.nta;
	if (r.lab) return byKey.lab;
	if (r.requestWith === 'ANNY') return byKey.anny;
	if (r.requestWith === 'MANAGEMENT') return byKey.mgmt;
	return byKey.default;
}
