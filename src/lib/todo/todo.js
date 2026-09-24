// Reine Logik rund um Todos (Anzeige-Texte, Filter, Sortierung) — ohne Svelte,
// damit sie sich mit vitest prüfen lässt.

/** @typedef {{ kind: string, key: string, label?: string, href?: string | null }} TodoLink */
/**
 * @typedef {Object} Todo
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {'LOW' | 'NORMAL' | 'HIGH'} priority
 * @property {string | null} dueDate ISO-Datum
 * @property {string[]} labels
 * @property {boolean} recurring
 * @property {boolean} done
 * @property {TodoLink[]} links
 * @property {number} commentCount
 */

/** @type {Record<string, string>} */
export const PRIORITY_LABEL = { HIGH: 'hoch', NORMAL: 'normal', LOW: 'niedrig' };

/** Die Link-Arten in der Reihenfolge des Auswahlmenüs. */
export const LINK_KINDS = [
	{ kind: 'PHASE', label: 'Phase', icon: '🧭' },
	{ kind: 'CONDITION', label: 'Planungsschritt', icon: '☑️' },
	{ kind: 'EXAM', label: 'Prüfung', icon: '📝' },
	{ kind: 'TEACHER', label: 'Prüfende/r', icon: '🧑‍🏫' },
	{ kind: 'ROOM', label: 'Raum', icon: '🚪' },
	{ kind: 'STUDY_PROGRAM', label: 'Studiengang', icon: '🎓' },
	{ kind: 'DAY', label: 'Tag', icon: '📅' },
	{ kind: 'NTA', label: 'NTA', icon: '♿' },
	{ kind: 'URL', label: 'Link (URL)', icon: '🔗' },
	{ kind: 'JIRA', label: 'Jira-Issue', icon: '🎫' }
];

/** Link-Arten, die frei eingegeben statt aus Vorschlägen gewählt werden. */
export const FREE_TEXT_KINDS = new Set(['URL', 'JIRA']);

/** @param {string} kind */
export const linkKindInfo = (kind) =>
	LINK_KINDS.find((k) => k.kind === kind) ?? { kind, label: kind, icon: '🔗' };

/** Heutiges Datum als ISO-String (lokale Zeit). */
export function todayISO(now = new Date()) {
	const p = (/** @type {number} */ n) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/**
 * @param {Pick<Todo, 'dueDate' | 'done'>} todo
 * @param {string} today ISO-Datum
 */
export const isOverdue = (todo, today) => !todo.done && !!todo.dueDate && todo.dueDate < today;

/** @param {string | null | undefined} iso @returns {string} „24.12.2026" */
export function formatDate(iso) {
	if (!iso) return '';
	const [y, m, d] = iso.slice(0, 10).split('-');
	return y && m && d ? `${d}.${m}.${y}` : iso;
}

/** @param {string | null | undefined} iso Zeitstempel @returns {string} „24.12.2026, 14:05" */
export function formatDateTime(iso) {
	if (!iso) return '';
	const dt = new Date(iso);
	if (Number.isNaN(dt.getTime())) return iso;
	return dt.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Das Vorsemester zu einer Semester-ID: 2026-WS → 2026-SS, 2026-SS → 2025-WS.
 * @param {string | null | undefined} semesterId
 * @returns {string | null}
 */
export function previousSemester(semesterId) {
	const m = /^(\d{4})-(SS|WS)$/.exec(semesterId ?? '');
	if (!m) return null;
	const year = Number(m[1]);
	return m[2] === 'WS' ? `${year}-SS` : `${year - 1}-WS`;
}

/**
 * „PHASE:phase1" ⇄ { kind, key } — der Link-Filter in der URL (?link=…).
 * @param {string | null | undefined} param
 * @returns {{ kind: string, key: string } | null}
 */
export function parseLinkParam(param) {
	if (!param) return null;
	const i = param.indexOf(':');
	if (i <= 0 || i === param.length - 1) return null;
	return { kind: param.slice(0, i), key: param.slice(i + 1) };
}

/** @param {{ kind: string, key: string }} link */
export const linkParam = (link) => `${link.kind}:${link.key}`;

/**
 * @typedef {Object} TodoFilter
 * @property {'open' | 'done' | 'all'} [status]
 * @property {string} [label]
 * @property {string} [priority]
 * @property {string} [kind] nur Todos mit mindestens einem Link dieser Art
 * @property {{ kind: string, key: string } | null} [link] nur Todos mit genau diesem Link
 * @property {string} [text] Volltext in Titel, Beschreibung, Labels und Link-Namen
 */

/**
 * @param {Todo[]} todos
 * @param {TodoFilter} f
 * @returns {Todo[]}
 */
export function filterTodos(todos, f) {
	const text = (f.text ?? '').trim().toLowerCase();
	return todos.filter((t) => {
		if (f.status === 'open' && t.done) return false;
		if (f.status === 'done' && !t.done) return false;
		if (f.label && !t.labels.includes(f.label)) return false;
		if (f.priority && t.priority !== f.priority) return false;
		if (f.kind && !t.links.some((l) => l.kind === f.kind)) return false;
		const link = f.link;
		if (link && !t.links.some((l) => l.kind === link.kind && l.key === link.key)) return false;
		if (text) {
			const haystack = [
				t.title,
				t.description,
				...t.labels,
				...t.links.map((l) => `${l.key} ${l.label ?? ''}`)
			]
				.join(' ')
				.toLowerCase();
			if (!haystack.includes(text)) return false;
		}
		return true;
	});
}

/**
 * Für die Startseite: Überfälliges zuerst, sonst die Reihenfolge des Backends
 * (offen vor erledigt, dann Priorität, Fälligkeit, Alter).
 * @param {Todo[]} todos
 * @param {string} today
 * @returns {Todo[]}
 */
export function overdueFirst(todos, today) {
	return [...todos].sort((a, b) => Number(isOverdue(b, today)) - Number(isOverdue(a, today)));
}

/**
 * Offene Todos je Phase: direkt an der Phase oder an einem ihrer Planungsschritte.
 * @param {Todo[]} todos
 * @param {{ key: string, conditions: { key: string }[] }[]} phases
 * @returns {Record<string, number>}
 */
export function openTodosPerPhase(todos, phases) {
	/** @type {Record<string, number>} */
	const counts = {};
	for (const phase of phases) {
		const conds = new Set(phase.conditions.map((c) => c.key));
		counts[phase.key] = todos.filter(
			(t) =>
				!t.done &&
				t.links.some(
					(l) =>
						(l.kind === 'PHASE' && l.key === phase.key) ||
						(l.kind === 'CONDITION' && conds.has(l.key))
				)
		).length;
	}
	return counts;
}

/**
 * Labels aus einer Komma-Liste: getrimmt, ohne Leere und Doppelte.
 * @param {string} s
 * @returns {string[]}
 */
export function parseLabels(s) {
	return [
		...new Set(
			s
				.split(',')
				.map((x) => x.trim())
				.filter(Boolean)
		)
	];
}
