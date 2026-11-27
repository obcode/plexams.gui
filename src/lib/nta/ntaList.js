// Logic of the NTA list import page (/nta/import), kept out of the component so
// it can be tested. The comparison itself comes from the backend (ntaListPreview).

/** SharePoint folder of the exam board with one NTA list per faculty. */
export const SHAREPOINT_URL =
	'https://hmedu.sharepoint.com/sites/ST/Freigegebene%20Dokumente/Forms/AllItems.aspx?id=%2Fsites%2FST%2FFreigegebene%20Dokumente%2F08%5FPP%2F08%5F12%5FPA%2DFallliste%2FNTA&viewid=a609c00a%2D816f%2D4fe1%2Db691%2Dbc0726ff969e&sharingv2=true&fromShare=true&at=9&CID=f187ef0b%2D119c%2D4e68%2Da212%2D743fdd703e92&FolderCTID=0x012000D860F0444DE9174EB6B56E0CBB7812AF';

/** @type {Record<string, { label: string, badge: string, order: number }>} */
export const STATUS = {
	NEW: { label: 'neu', badge: 'badge-success', order: 0 },
	CHANGED: { label: 'geändert', badge: 'badge-warning', order: 1 },
	PROBLEM: { label: 'unvollständig', badge: 'badge-error', order: 2 },
	UNCHANGED: { label: 'unverändert', badge: 'badge-ghost', order: 3 }
};

/**
 * Key of a row across lists: a student can only be in one list per faculty.
 * @param {string} fk
 * @param {{ line: number }} row
 */
export function rowKey(fk, row) {
	return `${fk}:${row.line}`;
}

/**
 * Whether a row is selected for applying when the page loads: new and changed
 * rows, not the unchanged ones and not those the backend could not read
 * completely (they need a look first).
 * @param {{ status: string }} row
 */
export function selectedByDefault(row) {
	return row.status === 'NEW' || row.status === 'CHANGED';
}

/**
 * The NTAInput to apply for a row: the planner's correction if there is one,
 * otherwise the backend's proposal.
 * @param {any} row
 * @param {any} [edited]
 */
export function applyItem(row, edited) {
	const p = edited ?? row.proposal;
	return {
		action: row.existing ? 'UPDATE' : 'ADD',
		nta: {
			name: p.name,
			email: p.email ?? null,
			mtknr: p.mtknr,
			compensation: p.compensation,
			deltaDurationPercent: Number(p.deltaDurationPercent),
			needsRoomAlone: !!p.needsRoomAlone,
			needsHardware: !!p.needsHardware,
			program: p.program,
			from: p.from,
			until: p.until
		}
	};
}

/**
 * Rows sorted by status (new, changed, problem, unchanged), then by name.
 * @param {any[]} rows
 */
export function sortRows(rows) {
	return [...rows].sort(
		(a, b) =>
			(STATUS[a.status]?.order ?? 9) - (STATUS[b.status]?.order ?? 9) ||
			a.name.localeCompare(b.name, 'de')
	);
}

/**
 * Number of rows per status.
 * @param {any[]} rows
 * @returns {Record<string, number>}
 */
export function countByStatus(rows) {
	/** @type {Record<string, number>} */
	const out = { NEW: 0, CHANGED: 0, PROBLEM: 0, UNCHANGED: 0 };
	for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
	return out;
}

/**
 * "27.11.2026" or "27.11.2026, 10:05" for an ISO time; '' for none.
 * @param {string | null | undefined} iso
 * @param {boolean} [withTime]
 */
export function formatDate(iso, withTime = false) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	/** @type {Intl.DateTimeFormatOptions} */
	const opts = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' };
	if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
	return d.toLocaleString('de-DE', opts);
}

/**
 * What an upload changed, in one sentence per list.
 * @param {any} s summary from POST /upload/nta-list
 */
export function uploadSummaryText(s) {
	const fk = `FK ${s.fk}`;
	if (s.firstUpload) return `${fk}: ${s.rows} Einträge eingelesen (erste Liste dieser Fakultät).`;
	const parts = [];
	if (s.newRows) parts.push(`${s.newRows} neu`);
	if (s.changedRows) parts.push(`${s.changedRows} geändert`);
	if (s.removedRows) parts.push(`${s.removedRows} nicht mehr enthalten`);
	const since = s.previousStand ? ` seit dem Stand vom ${formatDate(s.previousStand)}` : '';
	if (parts.length === 0)
		return `${fk}: Die Liste hat sich${since} nicht geändert (${s.rows} Einträge).`;
	return `${fk}: ${parts.join(', ')}${since}; ${s.unchangedRows} unverändert.`;
}
