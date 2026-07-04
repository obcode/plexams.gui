<script>
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';
	import SubscriptionTerminal from '$lib/SubscriptionTerminal.svelte';

	let { data } = $props();

	// Ampel je Art und Slot (exakt nach Spec):
	//  seatsNeeded == 0            → neutral (kein Bedarf)
	//  seatsNeeded > seatsAvailable → rot   (Kapazität reicht nicht)
	//  seatsBooked >= seatsNeeded   → grün  (genug gebucht)
	//  sonst                        → gelb  (noch X Plätze buchen)
	/** @param {any} n */
	function roomStatus(n) {
		if (!n || n.seatsNeeded === 0) return { level: 'neutral', text: 'kein Bedarf', deficit: 0 };
		if (n.seatsNeeded > n.seatsAvailable)
			return { level: 'red', text: 'Kapazität reicht nicht', deficit: 0 };
		if (n.seatsBooked >= n.seatsNeeded)
			return { level: 'green', text: 'genug gebucht', deficit: 0 };
		const deficit = n.seatsNeeded - n.seatsBooked;
		return { level: 'yellow', text: `noch ${deficit} Plätze buchen`, deficit };
	}
	/** @type {Record<string, string>} */
	const STATUS_DOT = { neutral: '⚪', red: '🔴', green: '🟢', yellow: '🟡' };
	// „eingeschränkt auf: …" — Räume, auf die die Preplan-Prüfungen dieses Slots/dieser
	// Art per roomConstraints.allowedRooms begrenzt sind (begrenzt seatsAvailable/rooms
	// serverseitig; hier nur zur Anzeige aus den Constraints abgeleitet).
	/** @param {any} slot @param {string} kind */
	function restrictedRooms(slot, kind) {
		/** @type {Set<string>} */
		const rooms = new Set();
		for (const e of data.exams) {
			if (e.examKind !== kind) continue;
			if (e.plannedDayNumber !== slot.dayNumber || e.plannedSlotNumber !== slot.slotNumber)
				continue;
			for (const r of e.constraints?.roomConstraints?.allowedRooms ?? []) rooms.add(r);
		}
		return [...rooms].sort((a, b) => a.localeCompare(b));
	}

	/** @param {string} level */
	const statusBorder = (level) =>
		level === 'red'
			? 'border-error/50 bg-error/5'
			: level === 'yellow'
				? 'border-warning/50 bg-warning/5'
				: level === 'green'
					? 'border-success/40 bg-success/5'
					: 'border-base-300';

	/** @param {string} t */
	const fmtTime = (t) => /(\d{2}:\d{2})/.exec(t ?? '')?.[1] ?? '';
	const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	/** @param {any} s → „Mo 13.07., 08:30 Uhr (1/1)" (Datum/Zeit stecken in starttime) */
	const slotLabel = (s) => {
		const ds = `(${s.dayNumber}/${s.slotNumber})`;
		const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(String(s.starttime ?? ''));
		if (!m) return `Tag ${s.dayNumber} · Slot ${s.slotNumber}`;
		const [, y, mo, d, hm] = m;
		const wd = WD[new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))).getUTCDay()];
		return `${wd} ${d}.${mo}., ${hm} Uhr ${ds}`;
	};
	/** @param {any} e */
	const slotValue = (e) =>
		e.plannedDayNumber != null && e.plannedSlotNumber != null
			? `${e.plannedDayNumber}-${e.plannedSlotNumber}`
			: '';

	// ---- Wochen-Kalender der eingeplanten Slots ----
	const WD2 = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
	/** @param {string} iso */
	const dateObj = (iso) => {
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
		return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
	};
	/** @param {Date} dt → Mo=1 … So=7 */
	const isoWeekday = (dt) => ((dt.getUTCDay() + 6) % 7) + 1;
	/** @param {Date} dt → Montag der Woche */
	const mondayOf = (dt) => {
		const m = new Date(dt);
		m.setUTCDate(dt.getUTCDate() - (isoWeekday(dt) - 1));
		return m;
	};
	/** @param {Date} dt → ISO-Kalenderwoche */
	function isoWeekNum(dt) {
		const d = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
		d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // Donnerstag dieser Woche
		const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
		firstThu.setUTCDate(firstThu.getUTCDate() - ((firstThu.getUTCDay() + 6) % 7) + 3);
		return 1 + Math.round((d.getTime() - firstThu.getTime()) / 604800000);
	}
	/** @param {Date} dt */
	const ddmm = (dt) =>
		`${String(dt.getUTCDate()).padStart(2, '0')}.${String(dt.getUTCMonth() + 1).padStart(2, '0')}.`;
	/** @param {Date} monday @param {number} col */
	const colDate = (monday, col) => {
		const d = new Date(monday);
		d.setUTCDate(monday.getUTCDate() + (col - 1));
		return d;
	};

	/** @type {Record<string, number>} */
	const LEVEL_RANK = { neutral: 0, green: 1, yellow: 2, red: 3 };
	/** @param {any} slot → „schlimmster" Raum-Status der Arten (für die Slot-Färbung) */
	function worstLevel(slot) {
		let lv = 'neutral';
		for (const need of [slot.exahm, slot.seb]) {
			if (need.examCount > 0) {
				const l = roomStatus(need).level;
				if (LEVEL_RANK[l] > LEVEL_RANK[lv]) lv = l;
			}
		}
		return lv;
	}

	// --- Filter der Prüfungstabelle nach Studiengang (Badges mit Anzahl) ---
	/** @type {string[]} */
	let selectedPrograms = $state([]);
	/** @param {string} p */
	const toggleProgFilter = (p) =>
		(selectedPrograms = selectedPrograms.includes(p)
			? selectedPrograms.filter((x) => x !== p)
			: [...selectedPrograms, p]);
	/** passt die Prüfung zum aktiven Studiengang-Filter? @param {any} ex */
	const matchesProgFilter = (ex) =>
		selectedPrograms.length > 0 &&
		(ex.programs ?? []).some((/** @type {string} */ p) => selectedPrograms.includes(p));

	let listError = $state('');
	/** @type {Set<number>} */
	let busy = $state(new Set());

	// ---- Editor ----
	/** @type {any} */
	let editing = $state(null);
	let isNew = $state(false);
	let editError = $state('');
	let saving = $state(false);
	let examerQuery = $state('');

	// Prüfende als „Nachname, Vorname" (letztes Token = Nachname; Titel bleiben beim
	// Vornamen) — alphabetisch nach Nachname, im Editor durchsuchbar.
	/** @param {string} full */
	function examerLabel(full) {
		const parts = (full ?? '').trim().split(/\s+/);
		if (parts.length < 2) return full ?? '';
		return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
	}
	// Anzeige eines Prüfenden: sauberer shortname über die examerID, sonst der
	// gespeicherte Snapshot (Voll-Name → „Nachname, …") als Fallback.
	/** @param {any} e */
	const examerDisplay = (e) => teacherById.get(e?.examerID) ?? examerLabel(e?.examerName ?? '');

	function openAdd() {
		editing = {
			id: 0,
			examKind: 'EXaHM',
			examerID: 0,
			module: '',
			programs: [],
			expectedStudents: 0,
			duration: '',
			notes: ''
		};
		isNew = true;
		editError = '';
		examerQuery = '';
	}
	/** @param {any} e */
	function openEdit(e) {
		editing = {
			id: e.id,
			examKind: e.examKind,
			examerID: e.examerID,
			module: e.module,
			programs: [...(e.programs ?? [])],
			expectedStudents: e.expectedStudents,
			duration: e.duration ?? '',
			notes: e.notes ?? ''
		};
		isNew = false;
		editError = '';
		examerQuery = '';
	}
	const closeEdit = () => (editing = null);

	// Studiengänge gruppiert: FK07 → MUC.DAI → Misc (sonstige Kategorien am Ende).
	/** @type {Record<string, string>} */
	const CAT_LABEL = { fk07: 'FK07', mucdai: 'MUC.DAI', misc: 'Misc' };
	const CAT_ORDER = ['fk07', 'mucdai', 'misc'];

	/** @param {string} sn */
	function toggleProgram(sn) {
		editing.programs = editing.programs.includes(sn)
			? editing.programs.filter((/** @type {string} */ x) => x !== sn)
			: [...editing.programs, sn];
	}

	async function save() {
		if (!Number(editing.examerID)) {
			editError = 'Prüfenden wählen.';
			return;
		}
		if (!editing.module.trim()) {
			editError = 'Modul ist Pflicht.';
			return;
		}
		const input = {
			examKind: editing.examKind,
			examerID: Number(editing.examerID),
			module: editing.module.trim(),
			programs: editing.programs,
			expectedStudents: Number(editing.expectedStudents) || 0,
			duration: editing.duration === '' ? null : Number(editing.duration),
			notes: (editing.notes ?? '').trim() || null
		};
		saving = true;
		editError = '';
		try {
			const url = isNew ? '/api/addPreplanExam' : '/api/updatePreplanExam';
			const body = isNew ? { input } : { id: editing.id, input };
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				editError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			closeEdit();
			await invalidateAll();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	/** @param {any} e */
	async function del(e) {
		if (!confirm(`Vorplanung „${e.module}" (${e.examKind}) löschen?`)) return;
		listError = '';
		try {
			const res = await fetch('/api/deletePreplanExam', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ id: e.id })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				listError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
		} catch (err) {
			listError = err instanceof Error ? err.message : String(err);
		}
	}

	/** @param {any} e @param {string} value */
	async function setSlot(e, value) {
		if (busy.has(e.id)) return;
		busy = new Set(busy).add(e.id);
		listError = '';
		const [d, s] = value ? value.split('-').map(Number) : [null, null];
		try {
			const res = await fetch('/api/setPreplanExamSlot', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ id: e.id, dayNumber: d, slotNumber: s })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				listError = result?.error || `Fehler (HTTP ${res.status})`;
			}
			await invalidateAll();
		} catch (err) {
			listError = err instanceof Error ? err.message : String(err);
		} finally {
			const set = new Set(busy);
			set.delete(e.id);
			busy = set;
		}
	}

	/** Slot fixieren/lösen. Fixieren nur möglich, wenn ein Slot gesetzt ist.
	 * @param {any} e @param {boolean} fixed */
	async function setFixed(e, fixed) {
		if (busy.has(e.id)) return;
		busy = new Set(busy).add(e.id);
		listError = '';
		try {
			const res = await fetch('/api/setPreplanExamFixed', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ id: e.id, fixed })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				listError = result?.error || `Fehler (HTTP ${res.status})`;
			}
			await invalidateAll();
		} catch (err) {
			listError = err instanceof Error ? err.message : String(err);
		} finally {
			const set = new Set(busy);
			set.delete(e.id);
			busy = set;
		}
	}

	// ZPA-Ancode-Zuordnung
	/** @type {any} */
	let suggestFor = $state(null);
	/** @type {any[]} */
	let suggestions = $state([]);
	let suggestLoading = $state(false);
	let suggestError = $state('');
	let manualAncode = $state('');
	let connecting = $state(false);

	const jsonHeaders = { 'content-type': 'application/json' };

	/** @param {any} e */
	async function openSuggest(e) {
		suggestFor = e;
		suggestions = [];
		suggestError = '';
		manualAncode = '';
		suggestLoading = true;
		try {
			const res = await fetch('/api/preplanExamAncodeSuggestions', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ id: e.id })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				suggestError = result?.error || `Fehler (HTTP ${res.status})`;
			} else {
				suggestions = result.preplanExamAncodeSuggestions ?? [];
			}
		} catch (err) {
			suggestError = err instanceof Error ? err.message : String(err);
		} finally {
			suggestLoading = false;
		}
	}

	function closeSuggest() {
		suggestFor = null;
	}

	/** @param {number|string} ancode */
	async function connect(ancode) {
		if (!suggestFor || connecting) return;
		const a = Number(ancode);
		if (!a) return;
		connecting = true;
		suggestError = '';
		try {
			const res = await fetch('/api/connectPreplanExamToAncode', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ id: suggestFor.id, ancode: a })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				suggestError = result?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			closeSuggest();
			await invalidateAll();
		} catch (err) {
			suggestError = err instanceof Error ? err.message : String(err);
		} finally {
			connecting = false;
		}
	}

	/** @param {any} e */
	async function disconnect(e) {
		if (!confirm(`Ancode ${e.ancode} von „${e.module}“ lösen?`)) return;
		listError = '';
		try {
			const res = await fetch('/api/disconnectPreplanExam', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ id: e.id })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				listError = result?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
		} catch (err) {
			listError = err instanceof Error ? err.message : String(err);
		}
	}

	/** @param {number} id → „Modul (Nachname, Vorname)" der verknüpften Preplan-Prüfung */
	const moduleOf = (id) => {
		const e = examById.get(id);
		if (!e) return `#${id}`;
		return e.examerName ? `${e.module} (${examerDisplay(e)})` : e.module;
	};

	/** Badges für die Tabellen-Anzeige der Constraints. @param {any} e */
	function conBadges(e) {
		// kein early-return bei fehlenden constraints — notSameSlot/canShareSlot
		// liegen direkt auf e und müssen auch ohne sonstige Constraints erscheinen.
		const c = e.constraints || {};
		const rc = c.roomConstraints || {};
		/** @type {{ t: string, cls: string }[]} */
		const out = [];
		// Pre-Exams: nur allowedRooms + die Slot-Relationen sind relevant.
		if ((rc.allowedRooms || []).length)
			out.push({ t: `Räume: ${rc.allowedRooms.join(', ')}`, cls: 'badge-ghost' });
		if ((c.sameSlot || []).length)
			out.push({ t: `=Slot: ${c.sameSlot.map(moduleOf).join(', ')}`, cls: 'badge-info' });
		if ((e.notSameSlot || []).length)
			out.push({ t: `≠Slot: ${e.notSameSlot.map(moduleOf).join(', ')}`, cls: 'badge-warning' });
		if ((e.canShareSlot || []).length)
			out.push({ t: `+Slot: ${e.canShareSlot.map(moduleOf).join(', ')}`, cls: 'badge-success' });
		return out;
	}

	/** @type {any} */
	let conEditing = $state(null);
	/** @type {any} */
	let conForm = $state(null);
	let conSaving = $state(false);
	let conError = $state('');
	// Konfliktpartner („nicht gleichzeitig") — eigene Mutation, sofort gespeichert.
	/** @type {number[]} */
	let conNotSame = $state([]);
	// „darf zusammen mit" — eigene Mutation, sofort gespeichert.
	/** @type {number[]} */
	let conCanShare = $state([]);

	/** @param {any} e */
	function openConstraints(e) {
		const c = e.constraints || {};
		const rc = c.roomConstraints || {};
		conEditing = e;
		// Für Pre-Exams nimmt setPreplanExamConstraints nur sameSlot + allowedRooms an.
		conForm = {
			allowedRooms: (rc.allowedRooms || []).join(', '),
			sameSlot: [...(c.sameSlot || [])]
		};
		conNotSame = [...(e.notSameSlot || [])];
		conCanShare = [...(e.canShareSlot || [])];
		conError = '';
	}
	const closeConstraints = () => (conEditing = null);

	/** @param {number} id */
	function toggleSameSlot(id) {
		conForm.sameSlot = conForm.sameSlot.includes(id)
			? conForm.sameSlot.filter((/** @type {number} */ x) => x !== id)
			: [...conForm.sameSlot, id];
	}

	/** Konfliktpartner sofort setzen/entfernen (eigene Mutation). @param {number} otherID */
	async function toggleNotSame(otherID) {
		const want = !conNotSame.includes(otherID);
		const prev = conNotSame;
		conNotSame = want ? [...conNotSame, otherID] : conNotSame.filter((x) => x !== otherID);
		conError = '';
		try {
			const res = await fetch('/api/setPreplanExamNotSameSlot', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ id: conEditing.id, otherID, conflict: want })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				conNotSame = prev; // zurücksetzen
				conError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
			syncConPairs();
		} catch (e) {
			conNotSame = prev;
			conError = e instanceof Error ? e.message : String(e);
		}
	}

	// nach Refetch die lokale Paar-Auswahl mit der Server-Wahrheit abgleichen
	function syncConPairs() {
		if (!conEditing) return;
		const fresh = data.exams.find((/** @type {any} */ x) => x.id === conEditing.id);
		if (fresh) {
			conNotSame = [...(fresh.notSameSlot || [])];
			conCanShare = [...(fresh.canShareSlot || [])];
		}
	}

	/** „darf zusammen mit" sofort setzen/entfernen (eigene Mutation). @param {number} otherID */
	async function toggleCanShare(otherID) {
		const want = !conCanShare.includes(otherID);
		const prev = conCanShare;
		conCanShare = want ? [...conCanShare, otherID] : conCanShare.filter((x) => x !== otherID);
		conError = '';
		try {
			const res = await fetch('/api/setPreplanExamCanShareSlot', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ id: conEditing.id, otherID, canShare: want })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				conCanShare = prev;
				conError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
			syncConPairs();
		} catch (e) {
			conCanShare = prev;
			conError = e instanceof Error ? e.message : String(e);
		}
	}

	async function saveConstraints() {
		if (conSaving) return;
		conSaving = true;
		conError = '';
		// Pre-Exams: das Backend übernimmt nur sameSlot + allowedRooms (Rest ignoriert).
		const constraints = {
			sameSlot: conForm.sameSlot.map(Number),
			allowedRooms: conForm.allowedRooms
				.split(/[\s,]+/)
				.map((/** @type {string} */ s) => s.trim())
				.filter(Boolean)
		};
		try {
			const res = await fetch('/api/setPreplanExamConstraints', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ id: conEditing.id, constraints })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				conError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			closeConstraints();
			await invalidateAll();
		} catch (e) {
			conError = e instanceof Error ? e.message : String(e);
		} finally {
			conSaving = false;
		}
	}

	// Zuordnung generieren & validieren
	/** @type {{ok:boolean, assignedCount:number, unassignedIDs:number[], messages:string[]}|null} */
	let validation = $state(/** @type {any} */ (null));
	let validationKind = $state('');
	let validating = $state(false);
	let generating = $state(false);

	async function validate() {
		if (validating || generating) return;
		validating = true;
		listError = '';
		try {
			const res = await fetch('/api/validatePreplanAssignment', {
				method: 'POST',
				headers: jsonHeaders
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				listError = result?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			validation = result.validatePreplanAssignment;
			validationKind = 'validate';
		} catch (err) {
			listError = err instanceof Error ? err.message : String(err);
		} finally {
			validating = false;
		}
	}

	async function generate() {
		if (validating || generating) return;
		if (
			!confirm(
				'Automatisch verteilen? Alle nicht-fixierten Prüfungen werden neu verteilt (auch bereits gesetzte). Nur 🔒 fixierte Prüfungen bleiben auf ihrem Slot.'
			)
		)
			return;
		generating = true;
		listError = '';
		try {
			const res = await fetch('/api/generatePreplanAssignment', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ keepAssigned: false })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				listError = result?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			validation = result.generatePreplanAssignment;
			validationKind = 'generate';
			await invalidateAll();
		} catch (err) {
			listError = err instanceof Error ? err.message : String(err);
		} finally {
			generating = false;
		}
	}
	let calendar = $derived(
		(() => {
			const planned = (data.calendarSlots ?? []).filter(
				(/** @type {any} */ s) => s.dayNumber != null && s.starttime
			);
			/** @type {Map<string, any>} */
			const weeks = new Map();
			/** @type {Set<number>} */
			const usedWd = new Set();
			for (const s of planned) {
				const dt = dateObj(s.starttime);
				if (!dt) continue;
				const wd = isoWeekday(dt);
				usedWd.add(wd);
				const mon = mondayOf(dt);
				const key = mon.toISOString().slice(0, 10);
				if (!weeks.has(key))
					weeks.set(key, { monday: mon, weekNum: isoWeekNum(dt), byDay: new Map() });
				const w = weeks.get(key);
				if (!w.byDay.has(wd)) w.byDay.set(wd, []);
				const slotExams = (data.exams ?? []).filter(
					(/** @type {any} */ e) =>
						e.plannedDayNumber === s.dayNumber && e.plannedSlotNumber === s.slotNumber
				);
				w.byDay.get(wd).push({ slot: s, exams: slotExams, time: fmtTime(s.starttime) });
			}
			for (const w of weeks.values())
				for (const arr of w.byDay.values())
					arr.sort(
						(/** @type {any} */ a, /** @type {any} */ b) => a.slot.slotNumber - b.slot.slotNumber
					);
			const weekList = [...weeks.values()].sort(
				(/** @type {any} */ a, /** @type {any} */ b) => a.monday.getTime() - b.monday.getTime()
			);
			const cols = [1, 2, 3, 4, 5].concat([6, 7].filter((d) => usedWd.has(d)));
			return { weekList, cols };
		})()
	);
	let unplanned = $derived(
		(data.exams ?? []).filter((/** @type {any} */ e) => e.plannedDayNumber == null)
	);
	// Reihenfolge der Badges: FK07 → MUC.DAI → Misc, dann Kürzel.
	let catRank = $derived(
		new Map(
			(data.studyPrograms ?? []).map((/** @type {any} */ sp) => [
				sp.shortname,
				CAT_ORDER.indexOf(sp.category ?? 'misc')
			])
		)
	);
	let programCounts = $derived(
		(() => {
			/** @type {Map<string, number>} */
			const m = new Map();
			for (const e of data.exams) for (const p of e.programs ?? []) m.set(p, (m.get(p) ?? 0) + 1);
			return [...m.entries()].sort((a, b) => {
				const ra = catRank.get(a[0]) ?? 99;
				const rb = catRank.get(b[0]) ?? 99;
				return ra - rb || a[0].localeCompare(b[0]);
			});
		})()
	);
	let filteredExams = $derived(
		selectedPrograms.length
			? data.exams.filter((/** @type {any} */ e) =>
					(e.programs ?? []).some((/** @type {string} */ p) => selectedPrograms.includes(p))
				)
			: data.exams
	);
	// teachers.shortname ist bereits „Nachname, Vorname" → direkt als Label nutzen.
	let teacherOptions = $derived(
		(data.teachers ?? [])
			.map((/** @type {any} */ t) => ({ id: t.id, label: t.shortname }))
			.sort((/** @type {any} */ a, /** @type {any} */ b) => a.label.localeCompare(b.label))
	);
	let teacherById = $derived(
		new Map((data.teachers ?? []).map((/** @type {any} */ t) => [t.id, t.shortname]))
	);
	let examerFiltered = $derived(
		examerQuery.trim()
			? teacherOptions.filter((/** @type {any} */ o) =>
					o.label.toLowerCase().includes(examerQuery.trim().toLowerCase())
				)
			: teacherOptions
	);
	let selectedExamerLabel = $derived(
		editing
			? (teacherOptions.find((/** @type {any} */ o) => o.id === Number(editing.examerID))?.label ??
					'')
			: ''
	);
	let programGroups = $derived(
		(() => {
			/** @type {Map<string, any[]>} */
			const byCat = new Map();
			for (const sp of data.studyPrograms ?? []) {
				const c = sp.category ?? 'misc';
				if (!byCat.has(c)) byCat.set(c, []);
				byCat.get(c)?.push(sp);
			}
			const cats = [
				...CAT_ORDER.filter((c) => byCat.has(c)),
				...[...byCat.keys()].filter((c) => !CAT_ORDER.includes(c))
			];
			return cats.map((c) => ({
				label: CAT_LABEL[c] ?? c,
				items: (byCat.get(c) ?? []).sort((a, b) => a.shortname.localeCompare(b.shortname))
			}));
		})()
	);
	// sameSlot-Gruppen: unvollständige (noch nicht alle Mitglieder verbunden) → Hinweis.
	let incompleteGroups = $derived(
		(data.sameSlotGroups ?? []).filter((/** @type {any} */ g) => !g.complete)
	);
	// sameSlot-Gruppe der aktuell zu verknüpfenden Pre-Prüfung (für Partner-Status).
	let suggestGroup = $derived(
		suggestFor
			? (data.sameSlotGroups ?? []).find((/** @type {any} */ g) =>
					g.members.some((/** @type {any} */ m) => m.id === suggestFor.id)
				)
			: null
	);
	// ---- Constraints-Editor (pro Preplan-Prüfung) ----
	let examById = $derived(new Map(data.exams.map((/** @type {any} */ e) => [e.id, e])));
	// Konfliktpartner-Kandidaten: nur andere Prüfungen mit gemeinsamem Studiengang
	// (ohne gemeinsamen Studiengang kann es keinen Slot-Konflikt geben).
	let notSameCandidates = $derived(
		conEditing
			? data.exams.filter(
					(/** @type {any} */ x) =>
						x.id !== conEditing.id &&
						(conEditing.programs ?? []).some((/** @type {string} */ p) =>
							(x.programs ?? []).includes(p)
						)
				)
			: []
	);
	let unassignedSet = $derived(new Set(validation?.unassignedIDs ?? []));
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">SEB/EXaHM-Vorplanung</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.exams.length}</span>
		<div class="flex-1"></div>
		<span class="text-xs text-base-content/50">
			🤖 verteilt alle <strong>nicht</strong>-fixierten Prüfungen neu; 🔒 fixierte bleiben.
		</span>
		<button class="btn btn-outline btn-sm" onclick={validate} disabled={validating || generating}>
			{validating ? 'prüft …' : '✔ Prüfen'}
		</button>
		<WriteButton
			class="btn btn-secondary btn-sm"
			onclick={generate}
			disabled={validating || generating}
			title="Verteilt alle nicht-fixierten Prüfungen neu (auch bereits gesetzte); fixierte bleiben."
		>
			{generating ? 'verteilt …' : '🤖 Automatisch verteilen'}
		</WriteButton>
		<button class="btn btn-primary btn-sm" onclick={openAdd}>+ Prüfung</button>
	</div>

	<!-- 🔌 Anny importieren → danach Übersicht (seatsBooked) neu laden -->
	<SubscriptionTerminal
		actions={[{ field: 'importAnnyBookings', label: '🔌 Anny-Buchungen importieren' }]}
		ondone={() => invalidateAll()}
	/>

	<div class="alert alert-info py-2 text-sm">
		<div class="flex w-full flex-col gap-1">
			<span>
				Diese Vorplanung liegt in der DB des <strong>betreffenden Semesters</strong> — plexams muss auf
				dieses Semester gestartet sein.
			</span>
			<span class="text-xs opacity-80">
				Ablauf: Pre-Exams erfassen → <strong>Zuordnung generieren</strong> →
				<strong>Validieren</strong> → fehlende Räume in Anny buchen → Anny-Buchungen importieren → erneut
				validieren, bis alles ok.
			</span>
			<span class="text-xs opacity-80">
				Constraints (Raum-Einschränkung, gleicher Slot …) werden beim Verknüpfen mit der ZPA-Prüfung
				automatisch übernommen.
			</span>
		</div>
	</div>

	{#if listError}
		<div class="alert alert-error py-2 text-sm"><span>{listError}</span></div>
	{/if}

	<!-- Befunde aus Validieren / Generieren -->
	{#if validation}
		{@const head =
			validationKind === 'generate'
				? `Zuordnung generiert: ${validation.assignedCount} Prüfung(en) platziert`
				: `Validierung: ${validation.assignedCount} zugeordnet`}
		<div
			class="alert {validation.ok ? 'alert-success' : 'alert-warning'} flex-col items-start py-3"
		>
			<div class="flex w-full items-center gap-2">
				<span class="font-medium">{head}</span>
				{#if validation.unassignedIDs.length}
					<span class="badge badge-warning badge-sm">
						{validation.unassignedIDs.length} ohne Slot
					</span>
				{:else}
					<span class="badge badge-success badge-sm">vollständig</span>
				{/if}
				<div class="flex-1"></div>
				<button class="btn btn-ghost btn-xs" onclick={() => (validation = null)}>schließen</button>
			</div>
			{#if validation.messages.length}
				<ul class="mt-1 list-inside list-disc text-sm">
					{#each validation.messages as m}
						<li>{m}</li>
					{/each}
				</ul>
			{:else if validation.unassignedIDs.length}
				<div class="mt-1 text-sm">
					Manche Prüfungen ohne Slot (kleine SEB ggf. gewollt; Engpässe siehe Hinweise).
				</div>
			{/if}
		</div>
	{/if}

	<!-- sameSlot-Gruppen, die noch nicht vollständig verbunden sind -->
	{#if incompleteGroups.length}
		<div class="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
			<div class="flex items-center gap-2">
				<span class="font-medium">⏳ Gleicher-Slot-Gruppen noch nicht vollständig verbunden</span>
				<span class="badge badge-warning badge-sm tabular-nums">{incompleteGroups.length}</span>
			</div>
			<div class="text-xs text-base-content/60">
				Der „gleicher Slot"-Constraint wird automatisch übernommen, sobald <strong>alle</strong>
				Mitglieder einer Gruppe mit einer ZPA-Prüfung verbunden sind — kein manuelles Übernehmen nötig.
			</div>
			{#each incompleteGroups as g}
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-warning/20 pt-1.5">
					{#each g.members as m}
						<span class="flex items-center gap-1">
							<span title={m.connected ? 'verbunden — Constraint aktiv' : 'noch nicht verbunden'}>
								{m.connected ? '✓' : '⏳'}
							</span>
							<span class="badge badge-xs {m.examKind === 'SEB' ? 'badge-error' : 'badge-info'}">
								{m.examKind}
							</span>
							<span class={m.connected ? '' : 'text-base-content/60'}>{m.module}</span>
							{#if m.ancode}<span class="font-mono text-base-content/50 tabular-nums"
									>{m.ancode}</span
								>{/if}
						</span>
					{/each}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Kalender: eingeplante Prüfungen & Räume, je Woche (Mo–Fr) -->
	<div class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold">Kalender — eingeplante Prüfungen & Räume</h2>

		{#if unplanned.length}
			<div class="rounded-lg border border-warning bg-warning/10 p-3">
				<div class="mb-1 flex items-center gap-2 text-sm font-medium">
					⚠ Noch nicht eingeplant
					<span class="badge badge-warning badge-sm tabular-nums">{unplanned.length}</span>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each unplanned as e}
						<span
							class="flex items-center gap-1 rounded border border-base-300 bg-base-100 px-2 py-1 text-xs"
						>
							<span class="badge badge-xs {e.examKind === 'SEB' ? 'badge-error' : 'badge-info'}">
								{e.examKind}
							</span>
							<span class="font-medium">{e.module}</span>
							<span class="text-base-content/50">
								· {examerDisplay(e)} · {e.expectedStudents}{#if e.programs?.length}
									· {e.programs.join(', ')}{/if}
							</span>
						</span>
					{/each}
				</div>
			</div>
		{/if}

		{#if calendar.weekList.length === 0}
			<div class="rounded-lg border border-base-300 p-6 text-center text-sm text-base-content/50">
				Noch keine Prüfungen in Slots eingeplant.
			</div>
		{:else}
			{#each calendar.weekList as w}
				<div class="flex flex-col gap-1">
					<div class="text-sm font-medium text-base-content/70">
						KW {w.weekNum} · {ddmm(w.monday)}–{ddmm(
							colDate(w.monday, calendar.cols[calendar.cols.length - 1])
						)}
					</div>
					<div
						class="grid gap-2"
						style="grid-template-columns: repeat({calendar.cols.length}, minmax(0, 1fr))"
					>
						{#each calendar.cols as col}
							{@const date = colDate(w.monday, col)}
							{@const entries = w.byDay.get(col) || []}
							<div class="flex flex-col gap-1 rounded-lg border border-base-300 bg-base-100 p-1.5">
								<div class="text-xs font-medium tabular-nums">{WD2[col]} {ddmm(date)}</div>
								{#each entries as en}
									{@const usedBooked = (en.slot.bookedRooms || []).filter(
										(/** @type {string} */ r) => !(en.slot.freeRooms || []).includes(r)
									)}
									{#if en.exams.length}
										<div
											class="rounded border bg-base-200/30 p-1.5 text-xs {statusBorder(
												worstLevel(en.slot)
											)}"
										>
											<div class="font-medium tabular-nums">{en.time} Uhr</div>
											{#each en.exams as ex}
												<div
													class="mt-0.5 flex items-center gap-1 {selectedPrograms.length
														? matchesProgFilter(ex)
															? 'rounded bg-primary/25 px-1 py-0.5 font-semibold text-primary ring-1 ring-primary'
															: 'opacity-25 grayscale'
														: ''}"
												>
													<span
														class="badge badge-xs {ex.examKind === 'SEB'
															? 'badge-error'
															: 'badge-info'}"
													>
														{ex.examKind}
													</span>
													{#if ex.isFixed}<span title="fixiert">🔒</span>{/if}
													<span class="truncate" title="{ex.module} · {examerDisplay(ex)}"
														>{ex.module}</span
													>
													<span class="truncate text-base-content/50">{examerDisplay(ex)}</span>
													<span class="tabular-nums text-base-content/40"
														>{ex.expectedStudents}</span
													>
													{#if ex.programs?.length}
														<span class="truncate text-base-content/40">
															{#each ex.programs as p, i}{i ? ', ' : ''}<span
																	class={selectedPrograms.includes(p)
																		? 'font-semibold text-primary'
																		: ''}>{p}</span
																>{/each}
														</span>
													{/if}
												</div>
											{/each}
											{#each [{ label: 'EXaHM', need: en.slot.exahm }, { label: 'SEB', need: en.slot.seb }] as k}
												{#if k.need.examCount > 0}
													{@const st = roomStatus(k.need)}
													{@const restricted = restrictedRooms(en.slot, k.label)}
													<div class="mt-1 flex flex-wrap items-center gap-x-1">
														<span>{STATUS_DOT[st.level]}</span>
														<span class="font-medium">{k.label}</span>
														<span
															class="tabular-nums text-base-content/60"
															title="genutzt / gebucht"
															>{k.need.seatsNeeded}/{k.need.seatsBooked} Pl.</span
														>
														{#if st.level === 'yellow' && k.need.roomsToBook.length}
															<span class="text-warning">→ {k.need.roomsToBook.join(', ')}</span>
														{:else if st.level === 'red'}
															<span class="text-error">Kapazität!</span>
														{/if}
													</div>
													{#if restricted.length}
														<div class="text-base-content/40">nur: {restricted.join(', ')}</div>
													{:else if k.need.rooms.length && k.need.seatsBooked === 0}
														<div class="text-base-content/40">
															Vorschlag: {k.need.rooms.join(', ')}
														</div>
													{/if}
												{/if}
											{/each}
											{#if usedBooked.length}
												<div class="mt-1 text-base-content/50">
													🔌 genutzt: {usedBooked.join(', ')}
												</div>
											{/if}
											{#each en.slot.conflicts as c}
												<div class="mt-0.5 text-warning">
													⚠ {c.program}: {c.modules.join(', ')}
												</div>
											{/each}
										</div>
									{/if}
									{#if en.slot.freeRooms && en.slot.freeRooms.length}
										<div
											class="rounded border border-dashed border-base-300 bg-base-100 px-1.5 py-1 text-xs text-base-content/50"
										>
											<span class="tabular-nums">{en.time}</span> · 🔓 frei: {en.slot.freeRooms.join(
												', '
											)}
										</div>
									{/if}
								{:else}
									<div class="py-2 text-center text-base-content/20">—</div>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if data.exams.length === 0}
		<div class="text-sm text-base-content/50">Noch keine SEB/EXaHM-Vorplanungen angelegt.</div>
	{:else}
		<!-- Filter nach Studiengang -->
		<div class="flex flex-wrap items-center gap-1">
			<span class="mr-1 text-sm text-base-content/50">Studiengang:</span>
			{#each programCounts as [prog, count]}
				<button
					class="badge gap-1 tabular-nums {selectedPrograms.includes(prog)
						? 'badge-primary'
						: 'badge-ghost'}"
					onclick={() => toggleProgFilter(prog)}
				>
					<span class="font-mono">{prog}</span>
					{count}
				</button>
			{/each}
			{#if selectedPrograms.length}
				<button class="btn btn-ghost btn-xs" onclick={() => (selectedPrograms = [])}>
					✕ {filteredExams.length}/{data.exams.length}
				</button>
			{/if}
		</div>

		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Art</th>
						<th>Modul</th>
						<th>Prüfender</th>
						<th>Studiengänge</th>
						<th>Studis</th>
						<th>Dauer</th>
						<th>Slot</th>
						<th>ZPA / Ancode</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each filteredExams as e (e.id)}
						<tr
							class="hover {unassignedSet.has(e.id)
								? 'bg-warning/10'
								: data.zpaPresent && !e.ancode
									? 'bg-warning/5'
									: ''}"
						>
							<td>
								{#if unassignedSet.has(e.id)}
									<span
										class="mr-1"
										title="ohne Slot — Details in den Hinweisen (kleine SEB ggf. gewollt)">⚠</span
									>
								{/if}
								{#if e.examKind === 'SEB'}
									<span class="badge badge-error badge-sm">SEB</span>
								{:else}
									<span class="badge badge-info badge-sm">{e.examKind}</span>
								{/if}
							</td>
							<td>
								<div class="font-medium">{e.module}</div>
								{#if e.notes}<div class="text-xs text-base-content/50">{e.notes}</div>{/if}
								{#if conBadges(e).length}
									<div class="mt-1 flex flex-wrap gap-1">
										{#each conBadges(e) as b}
											<span class="badge {b.cls} badge-xs">{b.t}</span>
										{/each}
									</div>
								{/if}
							</td>
							<td class="text-sm">{examerDisplay(e)}</td>
							<td>
								<div class="flex flex-wrap gap-1">
									{#each e.programs as p}
										<span class="badge badge-ghost badge-xs">{p}</span>
									{:else}
										<span class="text-base-content/40">—</span>
									{/each}
								</div>
							</td>
							<td class="tabular-nums">{e.expectedStudents}</td>
							<td class="tabular-nums text-base-content/70">{e.duration ?? '—'}</td>
							<td>
								<div class="flex items-center gap-1">
									{#if e.isFixed}
										<WriteButton
											class="btn btn-ghost btn-xs"
											title="fixiert — klicken zum Lösen"
											disabled={busy.has(e.id)}
											onclick={() => setFixed(e, false)}
										>
											🔒
										</WriteButton>
									{:else}
										<WriteButton
											class="btn btn-ghost btn-xs opacity-40"
											title={slotValue(e)
												? 'Slot fixieren (bleibt bei „Automatisch verteilen")'
												: 'erst einen Slot setzen, dann fixierbar'}
											disabled={busy.has(e.id) || !slotValue(e)}
											onclick={() => setFixed(e, true)}
										>
											🔓
										</WriteButton>
									{/if}
									<select
										class="select select-bordered select-xs {slotValue(e)
											? ''
											: 'select-warning text-warning'}"
										value={slotValue(e)}
										disabled={busy.has(e.id) || e.isFixed || page.data?.readOnly}
										onchange={(ev) => setSlot(e, ev.currentTarget.value)}
									>
										<option value="" class="text-warning">— nicht zugeordnet</option>
										{#each data.slots as s}
											<option value="{s.dayNumber}-{s.slotNumber}">{slotLabel(s)}</option>
										{/each}
									</select>
									{#if slotValue(e) && !e.isFixed}
										<WriteButton
											class="btn btn-ghost btn-xs text-error"
											title="Slot-Zuordnung aufheben"
											disabled={busy.has(e.id)}
											onclick={() => setSlot(e, '')}
										>
											✕
										</WriteButton>
									{/if}
								</div>
							</td>
							<td>
								{#if e.ancode}
									<span class="badge badge-success badge-sm tabular-nums">✓ {e.ancode}</span>
									<WriteButton class="btn btn-ghost btn-xs" onclick={() => disconnect(e)}
										>Lösen</WriteButton
									>
								{:else}
									<span class="badge badge-sm {data.zpaPresent ? 'badge-warning' : 'badge-ghost'}">
										nicht zugeordnet
									</span>
									<button class="btn btn-ghost btn-xs" onclick={() => openSuggest(e)}
										>Zuordnen</button
									>
								{/if}
							</td>
							<td class="text-right whitespace-nowrap">
								<button class="btn btn-ghost btn-xs" onclick={() => openConstraints(e)}>
									Constraints
								</button>
								<button class="btn btn-ghost btn-xs" onclick={() => openEdit(e)}>Bearbeiten</button>
								<WriteButton class="btn btn-ghost btn-xs text-error" onclick={() => del(e)}
									>Löschen</WriteButton
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Editor -->
{#if editing}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h2 class="text-lg font-semibold">
				SEB/EXaHM-Prüfung {isNew ? 'anlegen' : 'bearbeiten'}
			</h2>
			<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Art</span>
					<div class="flex gap-4">
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="radio"
								class="radio radio-sm"
								name="examKind"
								value="EXaHM"
								bind:group={editing.examKind}
							/>
							<span>EXaHM</span>
						</label>
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="radio"
								class="radio radio-sm"
								name="examKind"
								value="SEB"
								bind:group={editing.examKind}
							/>
							<span>SEB</span>
						</label>
					</div>
				</div>
				<div class="flex flex-col gap-1 sm:col-span-2">
					<div class="flex items-baseline gap-2">
						<span class="text-xs font-medium text-base-content/60"
							>Prüfender (Nachname, Vorname)</span
						>
						{#if selectedExamerLabel}
							<span class="text-xs text-primary">✓ {selectedExamerLabel}</span>
						{:else}
							<span class="text-xs text-error">— noch keine/r gewählt</span>
						{/if}
					</div>
					<input
						type="text"
						class="input input-bordered input-sm"
						bind:value={examerQuery}
						placeholder="suchen (Nachname) …"
					/>
					<div
						class="max-h-60 divide-y divide-base-200 overflow-y-auto rounded-lg border border-base-300"
					>
						{#each examerFiltered as o}
							<button
								type="button"
								class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-base-200 {Number(
									editing.examerID
								) === o.id
									? 'bg-primary/15 font-medium text-primary'
									: ''}"
								onclick={() => (editing.examerID = o.id)}
							>
								<span class="w-3 text-center">{Number(editing.examerID) === o.id ? '✓' : ''}</span>
								<span>{o.label}</span>
							</button>
						{:else}
							<div class="px-3 py-2 text-sm text-base-content/40">keine Treffer</div>
						{/each}
					</div>
				</div>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Modul</span>
					<input type="text" class="input input-bordered input-sm" bind:value={editing.module} />
				</label>
				<div class="flex gap-3">
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">erwartete Studis</span>
						<input
							type="number"
							class="input input-bordered input-sm w-28"
							bind:value={editing.expectedStudents}
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Dauer (Min., optional)</span>
						<input
							type="number"
							class="input input-bordered input-sm w-28"
							bind:value={editing.duration}
						/>
					</label>
				</div>
			</div>

			<div class="mt-3 flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Studiengänge</span>
				<div
					class="flex max-h-56 flex-col divide-y divide-base-200 overflow-y-auto rounded-lg border border-base-300"
				>
					{#each programGroups as g}
						<div class="flex items-start gap-2 p-2">
							<span
								class="w-16 shrink-0 pt-0.5 text-[10px] font-medium tracking-wide text-base-content/50 uppercase"
							>
								{g.label}
							</span>
							<div class="flex flex-wrap gap-x-4 gap-y-1">
								{#each g.items as sp}
									<label class="flex cursor-pointer items-center gap-1 text-sm">
										<input
											type="checkbox"
											class="checkbox checkbox-xs"
											checked={editing.programs.includes(sp.shortname)}
											onchange={() => toggleProgram(sp.shortname)}
										/>
										<span class="font-mono">{sp.shortname}</span>
									</label>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<label class="mt-3 flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Notizen (optional)</span>
				<input type="text" class="input input-bordered input-sm" bind:value={editing.notes} />
			</label>

			{#if editError}
				<div class="alert alert-error mt-3 py-2 text-sm"><span>{editError}</span></div>
			{/if}
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={closeEdit} disabled={saving}>Abbrechen</button
				>
				<WriteButton class="btn btn-primary btn-sm" onclick={save} disabled={saving}>
					{saving ? 'speichert …' : 'Speichern'}
				</WriteButton>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={closeEdit}></button>
	</div>
{/if}

<!-- ZPA-Ancode zuordnen -->
{#if suggestFor}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h2 class="text-lg font-semibold">Ancode zuordnen</h2>
			<p class="mt-1 text-sm text-base-content/60">
				{suggestFor.examKind} · {suggestFor.module} · {examerDisplay(suggestFor)}
			</p>

			{#if suggestGroup}
				<div class="mt-2 rounded-lg border border-base-300 bg-base-200/40 p-2 text-sm">
					<div class="mb-1 flex items-center gap-2 text-xs font-medium text-base-content/60">
						=Slot-Partner
						{#if suggestGroup.complete}
							<span class="badge badge-success badge-xs">vollständig — Constraint aktiv</span>
						{:else}
							<span class="badge badge-warning badge-xs">unvollständig</span>
						{/if}
					</div>
					<div class="flex flex-col gap-0.5">
						{#each suggestGroup.members as m}
							<div class="flex items-center gap-2 {m.id === suggestFor.id ? 'font-medium' : ''}">
								<span title={m.connected ? 'verbunden — Constraint aktiv' : 'noch nicht verbunden'}>
									{m.connected ? '✓' : '⏳'}
								</span>
								<span class="badge badge-xs {m.examKind === 'SEB' ? 'badge-error' : 'badge-info'}">
									{m.examKind}
								</span>
								<span>{m.module}</span>
								{#if m.ancode}<span class="font-mono text-base-content/50 tabular-nums"
										>{m.ancode}</span
									>{/if}
								<span class="text-xs {m.connected ? 'text-success' : 'text-base-content/40'}">
									{m.connected
										? 'Constraint aktiv'
										: 'wird automatisch übernommen, sobald verbunden'}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if suggestLoading}
				<div class="mt-4 flex items-center gap-2 text-sm text-base-content/60">
					<span class="loading loading-spinner loading-sm"></span> lädt Vorschläge …
				</div>
			{:else}
				{#if suggestError}
					<div class="alert alert-error mt-3 py-2 text-sm"><span>{suggestError}</span></div>
				{/if}

				{#if suggestions.length > 0}
					<div class="mt-3 overflow-x-auto rounded-lg border border-base-300">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Ancode</th>
									<th>Modul</th>
									<th>Prüfender</th>
									<th>Typ</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each suggestions as s}
									<tr class="hover">
										<td class="tabular-nums font-medium">{s.ancode}</td>
										<td>{s.module}</td>
										<td class="text-sm">{s.mainExamer}</td>
										<td class="text-sm text-base-content/70">{s.examType}</td>
										<td class="text-right">
											<WriteButton
												class="btn btn-primary btn-xs"
												disabled={connecting}
												onclick={() => connect(s.ancode)}
											>
												verknüpfen
											</WriteButton>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="mt-3 text-sm text-base-content/50">
						Keine Vorschläge — die ZPA-Prüfungsliste ist evtl. noch nicht importiert oder es gibt
						keinen passenden Treffer. Du kannst den Ancode unten manuell eintragen.
					</div>
				{/if}

				<div class="mt-4 flex items-end gap-2 border-t border-base-300 pt-3">
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Ancode manuell</span>
						<input
							type="number"
							class="input input-bordered input-sm w-32"
							bind:value={manualAncode}
						/>
					</label>
					<WriteButton
						class="btn btn-outline btn-sm"
						disabled={connecting || !manualAncode}
						onclick={() => connect(manualAncode)}
					>
						verknüpfen
					</WriteButton>
				</div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={closeSuggest} disabled={connecting}>
					Schließen
				</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={closeSuggest}></button>
	</div>
{/if}

<!-- Constraints-Editor (pro Preplan-Prüfung) -->
{#if conEditing}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h2 class="text-lg font-semibold">Constraints — {conEditing.module}</h2>
			<p class="mt-1 text-sm text-base-content/60">
				{conEditing.examKind} · {examerDisplay(conEditing)}
			</p>
			<div class="mt-1 text-xs text-base-content/50">
				Constraints werden beim Verknüpfen mit der ZPA-Prüfung automatisch übernommen.
			</div>

			<!-- Raum-Einschränkung (für Pre-Exams nur allowedRooms relevant) -->
			<div class="mt-3 flex flex-col gap-2 rounded-lg border border-base-300 p-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">
						erlaubte Räume (Komma-getrennt, leer = keine Einschränkung)
					</span>
					<input
						type="text"
						class="input input-bordered input-sm"
						bind:value={conForm.allowedRooms}
						placeholder="z. B. R1.046, R1.049"
					/>
				</label>
			</div>

			<!-- sameSlot: andere Preplan-Prüfungen -->
			<div class="mt-3 flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">
					gleicher Slot wie (andere Vorplanungs-Prüfungen)
				</span>
				<div
					class="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-base-300 p-2"
				>
					{#each data.exams.filter((/** @type {any} */ x) => x.id !== conEditing.id) as o}
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="checkbox"
								class="checkbox checkbox-xs"
								checked={conForm.sameSlot.includes(o.id)}
								onchange={() => toggleSameSlot(o.id)}
							/>
							<span class="badge badge-xs {o.examKind === 'SEB' ? 'badge-error' : 'badge-info'}">
								{o.examKind}
							</span>
							<span>{o.module}</span>
							<span class="text-base-content/40">· {examerDisplay(o)}</span>
						</label>
					{:else}
						<span class="text-sm text-base-content/40">— keine weiteren Prüfungen</span>
					{/each}
				</div>
			</div>

			<!-- notSameSlot: Konfliktpartner („nicht gleichzeitig") -->
			<div class="mt-3 flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">
					nicht gleichzeitig wie (Konfliktpartner)
					<span class="text-base-content/40">— wird sofort gespeichert</span>
				</span>
				<div
					class="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-base-300 p-2"
				>
					{#each notSameCandidates as o}
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="checkbox"
								class="checkbox checkbox-xs"
								checked={conNotSame.includes(o.id)}
								onchange={() => toggleNotSame(o.id)}
							/>
							<span class="badge badge-xs {o.examKind === 'SEB' ? 'badge-error' : 'badge-info'}">
								{o.examKind}
							</span>
							<span>{o.module}</span>
							<span class="text-base-content/40">· {examerDisplay(o)}</span>
							<span class="text-base-content/40">· {(o.programs ?? []).join(', ')}</span>
						</label>
					{:else}
						<span class="text-sm text-base-content/40">
							— keine Prüfungen mit gemeinsamem Studiengang
						</span>
					{/each}
				</div>
			</div>

			<!-- canShareSlot: „darf zusammen mit" -->
			<div class="mt-3 flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">
					darf zusammen mit (gemeinsamer Slot erlaubt)
					<span class="text-base-content/40">— wird sofort gespeichert</span>
				</span>
				<div
					class="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-base-300 p-2"
				>
					{#each data.exams.filter((/** @type {any} */ x) => x.id !== conEditing.id) as o}
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="checkbox"
								class="checkbox checkbox-xs"
								checked={conCanShare.includes(o.id)}
								onchange={() => toggleCanShare(o.id)}
							/>
							<span class="badge badge-xs {o.examKind === 'SEB' ? 'badge-error' : 'badge-info'}">
								{o.examKind}
							</span>
							<span>{o.module}</span>
							<span class="text-base-content/40">· {examerDisplay(o)}</span>
						</label>
					{:else}
						<span class="text-sm text-base-content/40">— keine weiteren Prüfungen</span>
					{/each}
				</div>
			</div>

			{#if conError}
				<div class="alert alert-error mt-3 py-2 text-sm"><span>{conError}</span></div>
			{/if}
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={closeConstraints} disabled={conSaving}>
					Abbrechen
				</button>
				<WriteButton class="btn btn-primary btn-sm" onclick={saveConstraints} disabled={conSaving}>
					{conSaving ? 'speichert …' : 'Speichern'}
				</WriteButton>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={closeConstraints}></button>
	</div>
{/if}
