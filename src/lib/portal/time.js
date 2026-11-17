// Datumsangaben im Portal immer in Berliner Zeit. Der Container setzt keine
// Zeitzone; ohne feste Angabe erschiene eine Frist beim Rendern auf dem Server
// ein bis zwei Stunden zu früh.
const formatter = new Intl.DateTimeFormat('de-DE', {
	timeZone: 'Europe/Berlin',
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

/**
 * @param {string | Date | null | undefined} value
 * @returns {string}
 */
export function formatBerlin(value) {
	if (!value) return '';
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? '' : formatter.format(d);
}
