// Zeilenweiser Diff (LCS) für den Template-Editor — rein clientseitig, keine
// Abhängigkeit. Vergleicht zwei Texte und liefert Zeilen mit Herkunft, damit
// die Editor-Ansicht „ungespeicherte Änderungen" bzw. „Änderungen gegen
// Standard" farblich anzeigen kann.

/**
 * @typedef {Object} DiffRow
 * @property {'ctx'|'add'|'del'} type  unverändert | hinzugefügt (nur in b) | entfernt (nur in a)
 * @property {string} text
 * @property {number|null} aLine  1-basierte Zeilennr. im „alten" Text (a) bzw. null
 * @property {number|null} bLine  1-basierte Zeilennr. im „neuen" Text (b) bzw. null
 */

/**
 * Zeilenweiser Diff zwischen `a` (alt) und `b` (neu) über die längste gemeinsame
 * Teilfolge (LCS). Leerer String → keine Zeilen (nicht eine leere Zeile).
 *
 * @param {string} a
 * @param {string} b
 * @returns {DiffRow[]}
 */
export function lineDiff(a, b) {
	const al = a === '' ? [] : a.split('\n');
	const bl = b === '' ? [] : b.split('\n');
	const n = al.length;
	const m = bl.length;

	// dp[i][j] = Länge der LCS von al[i..] und bl[j..]
	const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			dp[i][j] = al[i] === bl[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}

	/** @type {DiffRow[]} */
	const out = [];
	let i = 0;
	let j = 0;
	while (i < n && j < m) {
		if (al[i] === bl[j]) {
			out.push({ type: 'ctx', text: al[i], aLine: i + 1, bLine: j + 1 });
			i++;
			j++;
		} else if (dp[i + 1][j] >= dp[i][j + 1]) {
			out.push({ type: 'del', text: al[i], aLine: i + 1, bLine: null });
			i++;
		} else {
			out.push({ type: 'add', text: bl[j], aLine: null, bLine: j + 1 });
			j++;
		}
	}
	while (i < n) out.push({ type: 'del', text: al[i], aLine: i++ + 1, bLine: null });
	while (j < m) out.push({ type: 'add', text: bl[j], aLine: null, bLine: j++ + 1 });
	return out;
}

/**
 * Zählt hinzugefügte/entfernte Zeilen eines Diffs (für „+3 / −1"-Badges).
 * @param {DiffRow[]} rows
 * @returns {{ added: number, removed: number }}
 */
export function diffStat(rows) {
	let added = 0;
	let removed = 0;
	for (const r of rows) {
		if (r.type === 'add') added++;
		else if (r.type === 'del') removed++;
	}
	return { added, removed };
}
