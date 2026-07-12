// Prüfungsverteilungs-Statistik (examSpreadStatistics): reine Anzeige-Hilfslogik —
// feste Bucket-Reihenfolge, semantische Farbtönung, Balkenbreiten und Formatierung.
// Kein Datenzugriff hier; die Query lebt im +page.server.ts der Statistik-Seite.

// Feste Anzeige-Reihenfolge der Spread-Buckets: vom schlechtesten (Konflikt) zum
// besten (viele freie Tage). Der Server liefert sie zwar schon so, aber wir
// erzwingen die Reihenfolge, damit Diagramm und Legende stabil bleiben.
export const BUCKET_ORDER = [
	'OVERLAP',
	'SAME_DAY',
	'ADJACENT',
	'ONE_FREE',
	'TWO_FREE',
	'THREE_PLUS_FREE'
];

// Semantische Tönung je Bucket (daisyUI-Farbtoken ohne Präfix):
//   OVERLAP            → error   (Konflikt, rot)
//   SAME_DAY/ADJACENT  → warning (eng, gelb/orange)
//   *_FREE             → success (entzerrt, grün)
/** @type {Record<string, string>} */
const BUCKET_TONE = {
	OVERLAP: 'error',
	SAME_DAY: 'warning',
	ADJACENT: 'warning',
	ONE_FREE: 'success',
	TWO_FREE: 'success',
	THREE_PLUS_FREE: 'success'
};

/**
 * Bringt die Buckets in die feste Reihenfolge (BUCKET_ORDER). Unbekannte Keys
 * landen stabil am Ende, statt verworfen zu werden.
 * @template {{ key: string }} T
 * @param {T[] | null | undefined} buckets
 * @returns {T[]}
 */
export function orderBuckets(buckets) {
	const rank = (/** @type {string} */ k) => {
		const i = BUCKET_ORDER.indexOf(k);
		return i === -1 ? BUCKET_ORDER.length : i;
	};
	return [...(buckets ?? [])].sort((a, b) => rank(a.key) - rank(b.key));
}

/**
 * daisyUI-Farbtoken (error|warning|success|neutral) für einen Bucket-Key.
 * @param {string} key
 * @returns {string}
 */
export function bucketTone(key) {
	return BUCKET_TONE[key] ?? 'neutral';
}

/**
 * Tönung aus der kleinsten Zahl freier Tage eines Studierenden ableiten
 * (Überschneidung = -2, selber Tag = -1, aufeinanderfolgend = 0). Für die
 * Worst-Case-Badges im Drilldown, wo nur minFreeDays vorliegt.
 * @param {number | null | undefined} n
 * @returns {string}
 */
export function toneFromMinFreeDays(n) {
	if (n == null) return 'neutral';
	if (n <= -2) return 'error';
	if (n <= 0) return 'warning';
	return 'success';
}

/**
 * Balkenbreite (Prozent 0–100) eines Buckets, bezogen auf die Summe der counts.
 * Skalenunabhängig von share, damit die Balken auch bei Rundung korrekt sind.
 * @param {number} count
 * @param {number} total
 * @returns {number}
 */
export function barPercent(count, total) {
	return total > 0 ? (count / total) * 100 : 0;
}

/**
 * Summe der counts einer Bucket-Liste (Nenner für barPercent).
 * @param {{ count?: number }[] | null | undefined} buckets
 * @returns {number}
 */
export function totalCount(buckets) {
	return (buckets ?? []).reduce((s, b) => s + (b.count ?? 0), 0);
}

/**
 * Anteil als Prozentstring (eine Nachkommastelle, geschütztes Leerzeichen).
 * @param {number | null | undefined} v
 * @returns {string}
 */
export function formatShare(v) {
	if (v == null || Number.isNaN(v)) return '–';
	return `${v.toFixed(1)}\u00a0%`;
}

/**
 * Zahl mit einer Nachkommastelle (z. B. Ø Prüfungen, Ø min. freie Tage). Werte
 * können negativ sein (selber Tag = -1, Überschneidung = -2).
 * @param {number | null | undefined} v
 * @returns {string}
 */
export function formatDecimal(v) {
	if (v == null || Number.isNaN(v)) return '–';
	return v.toFixed(1);
}
