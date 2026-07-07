<script>
	import Slot from '$lib/slot/Slot.svelte';
	import { normalizeFk, planningFk, displayAncode } from '$lib/exam/fk';
	import {
		dateObj,
		isoWeekday,
		mondayOf,
		isoWeekNum,
		ddmm,
		minutesOfDay,
		hhmm
	} from '$lib/date/calendar';
	import { filterPlanned } from '$lib/exam/examFilter';
	import ExamsWithoutSlot from '$lib/examsInPlan/ExamsWithoutSlot.svelte';
	import NoSemesterConfig from '$lib/config/NoSemesterConfig.svelte';
	import { combineStarttime, isStandardStarttime } from '$lib/exam/setExamTime';
	import { inPeriod, dayNumberForTime, slotNumberForTime } from '$lib/slot/derive';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	let { data } = $props();

	let examsWithoutSlot = $derived(data.examsWithoutSlot ?? []);

	let onlyPlannedByMe = $state(true);
	let details = $state(false);
	let moveable = false;

	let maxSlots =
		(data.semesterConfig?.days?.length ?? 0) * (data.semesterConfig?.starttimes?.length ?? 0);

	// // status can be
	// // unknown
	// // allowed
	// // forbidden
	// // awkward

	let onlyConflicts = $state(true);

	let showExam = $state('all');
	let showAncode = $state('0');
	let showExamerID = $state('all');
	let showOnlyOnline = false;
	let showOnlyExahm = $state(false);
	let showOnlySEB = false;
	let showOnlyEXaHMRooms = $state(false);
	let showMucdaiSlots = $state(false);

	let allProgramsInPlan = $state(/** @type {any[]} */ ([]));
	async function getPrograms() {
		const response = await fetch('/api/exam/allProgramsInPlan', {
			method: 'GET'
		});

		allProgramsInPlan = await response.json();
	}
	let allAncodes = $state(/** @type {any[]} */ ([]));
	async function getAncodes() {
		const response = await fetch('/api/exam/ancodesInPlan', {
			method: 'GET'
		});

		allAncodes = await response.json();
	}
	let allExamer = $state(/** @type {any[]} */ ([]));
	async function getExamer() {
		const response = await fetch('/api/exam/examerInPlan', {
			method: 'GET'
		});

		allExamer = await response.json();
	}

	// Reaktiver Status je Slot (Schlüssel „day,time"). Bewusst ein einfaches Objekt,
	// KEINE Map: $state proxyt nur Objekte/Arrays tief — Map-Mutationen wären nicht
	// reaktiv, und die grün/gelb/rot-Färbung würde erst nach einem Neuaufbau des
	// Rasters (View-Wechsel) erscheinen.
	let slotsStatus = $state(/** @type {Record<string, any>} */ ({}));

	function initSlotsStatus(/** @type {any} */ status) {
		for (let day of data.semesterConfig?.days ?? []) {
			for (let time of data.semesterConfig?.starttimes ?? []) {
				slotsStatus[`${day.number},${time.number}`] = status;
			}
		}
	}

	let refresh = $state(/** @type {any} */ (new Map()));

	function initRefresh() {
		for (let day of data.semesterConfig?.days ?? []) {
			for (let time of data.semesterConfig?.starttimes ?? []) {
				refresh[`${day.number},${time.number}`] = false;
			}
		}
	}

	function statusColor(/** @type {any} */ status) {
		if (status == 'allowed') return 'bg-success/20';
		if (status == 'awkward') return 'bg-warning/30';
		if (status == 'forbidden') return 'bg-error/15';
		return '';
	}

	let mucdaiSlot = /** @type {any} */ (new Map());

	// Slot hat nur noch starttime → Grid-Key (day,slot) lokal ableiten.
	/** @param {string} iso */
	const slotKey = (iso) =>
		`${dayNumberForTime(iso, data.semesterConfig?.days)},${slotNumberForTime(iso, data.semesterConfig?.starttimes)}`;

	for (const slot of data.semesterConfig?.mucDaiSlots ?? []) {
		mucdaiSlot[slotKey(slot.starttime)] = 'rounded ring-2 ring-error/70';
	}

	let mucdaiSlotToShow = $state(/** @type {any} */ (new Map()));

	function handleMucdaiSlots() {
		if (showMucdaiSlots) {
			mucdaiSlotToShow = mucdaiSlot;
		} else {
			mucdaiSlotToShow = new Map();
		}
	}

	onMount(() => {
		getPrograms();
		getAncodes();
		getExamer();
	});

	let selectedExam = $state(-1);
	let conflictingAncodes = $state(/** @type {any[]} */ ([]));
	let selectedExamerID = $state(-1);

	async function handleSelect(/** @type {any} */ payload) {
		initSlotsStatus('forbidden');
		selectedExam = payload.ancode;
		selectedExamerID = payload.mainExamerID;
		let allowedSlots = await fetchAllowedSlots(payload.ancode);
		for (let slot of allowedSlots) {
			slotsStatus[slotKey(slot.starttime)] = 'allowed';
		}
		let akwardSlots = await fetchAwkwardSlots(payload.ancode);
		for (let slot of akwardSlots) {
			if (slotsStatus[slotKey(slot.starttime)] == 'allowed') {
				slotsStatus[slotKey(slot.starttime)] = 'awkward';
			}
		}
		let res = await fetchconflictingAncodes(payload.ancode);
		conflictingAncodes = res.map((/** @type {any} */ conflict) => conflict.ancode);
	}

	function handleUnselect() {
		initSlotsStatus('unknown');
		selectedExam = -1;
		selectedExamerID = -1;
		conflictingAncodes = [];
		resetPlaceInputs();
	}

	// ---- Manuelle Platzierung (setExamTime) ----
	// Das Backend speichert die absolute Startzeit und leitet Tag/Slot ab; es akzeptiert
	// jede Zeit. Zwei Wege: Klick auf eine Slot-Zelle („＋ hier", Standard-Anfangszeit)
	// oder freie Datum/Zeit-Eingabe. Für die freie Eingabe warnen wir client-seitig, wenn
	// die Uhrzeit keine Standard-Anfangszeit ist (isStandardStarttime).
	let placeNonce = $state(0); // ++ nach Erfolg → {#key} baut das Raster neu (Slots holen frisch)
	let placeBusy = $state(false);
	let placeError = $state('');
	let placeDate = $state('');
	let placeTime = $state('');
	let nonStandard = $state(false); // freie Zeit ist keine Standard-Anfangszeit → Bestätigung nötig

	let standardStarts = $derived(
		(data.semesterConfig?.starttimes ?? []).map((/** @type {any} */ t) => t.start)
	);

	function resetPlaceInputs() {
		placeDate = '';
		placeTime = '';
		nonStandard = false;
		placeError = '';
	}

	// Offset-Referenz für ein Datum: der passende Prüfungstag (gleiche Zeitzone wie das
	// Backend), sonst der erste Tag, sonst 'Z'.
	/** @param {string} date yyyy-mm-dd */
	function tzRefFor(date) {
		const days = data.semesterConfig?.days ?? [];
		const hit = days.find((/** @type {any} */ d) => String(d.date).slice(0, 10) === date);
		return (hit ?? days[0])?.date ?? null;
	}

	/** @param {string} starttime absolute Time */
	async function placeExam(starttime) {
		if (placeBusy || selectedExam === -1) return;
		placeBusy = true;
		placeError = '';
		try {
			const res = await fetch('/api/exam/setExamTime', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: selectedExam, starttime })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				placeError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
			placeNonce++;
			handleUnselect();
		} catch (e) {
			placeError = e instanceof Error ? e.message : String(e);
		} finally {
			placeBusy = false;
		}
	}

	// Klick auf „＋ hier" einer Slot-Zelle → Standard-Anfangszeit dieses Slots.
	/** @param {{ day: any, time: any }} payload */
	function handlePlace(payload) {
		const { day, time } = payload;
		placeExam(combineStarttime(day.date, time.start, day.date));
	}

	// Freie Datum/Zeit-Eingabe. force überspringt die Standard-Zeit-Warnung.
	/** @param {boolean} [force] */
	function submitFreeTime(force = false) {
		placeError = '';
		if (!placeDate || !placeTime) {
			placeError = 'Datum und Zeit angeben.';
			return;
		}
		const starttime = combineStarttime(placeDate, placeTime, tzRefFor(placeDate));
		if (!force && !isStandardStarttime(starttime, standardStarts)) {
			nonStandard = true;
			return;
		}
		nonStandard = false;
		placeExam(starttime);
	}

	async function fetchAllowedSlots(/** @type {any} */ ancode) {
		const response = await fetch('/api/slot/allowedSlots', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.allowedSlots;
	}

	async function fetchAwkwardSlots(/** @type {any} */ ancode) {
		const response = await fetch('/api/slot/awkwardSlots', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.awkwardSlots;
	}

	async function fetchconflictingAncodes(/** @type {any} */ ancode) {
		const response = await fetch('/api/exam/conflictingAncodes', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.conflictingAncodes;
	}

	function globalForbiddenSlot(/** @type {any} */ day, /** @type {any} */ time) {
		const key = `${day},${time}`;
		if (data.globalSlotStatus.get(key) === 'forbidden') {
			return 'bg-base-300';
		}
	}

	// ---- Ansicht (Kalender nach Wochen ↔ Raster Tage×Zeiten) ----
	let view = $state('kalender');
	const WD2 = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	// Datums-/Kalender-Mathematik lebt in $lib/date/calendar (unit-getestet).

	// Tage nach ISO-Woche gruppieren; Spalten Mo–Fr (+Sa/So falls genutzt).
	let weeks = $derived(
		(() => {
			/** @type {Map<string, any>} */
			const map = new Map();
			/** @type {Set<number>} */
			const usedWd = new Set();
			for (const d of data.semesterConfig?.days ?? []) {
				const dt = dateObj(d.date);
				if (!dt) continue;
				const wd = isoWeekday(dt);
				usedWd.add(wd);
				const mon = mondayOf(dt);
				const key = mon.toISOString().slice(0, 10);
				if (!map.has(key)) map.set(key, { monday: mon, weekNum: isoWeekNum(dt), byWd: new Map() });
				map.get(key).byWd.set(wd, d);
			}
			const cols = [1, 2, 3, 4, 5].concat([6, 7].filter((w) => usedWd.has(w)));
			const weekList = [...map.values()].sort(
				(/** @type {any} */ a, /** @type {any} */ b) => a.monday.getTime() - b.monday.getTime()
			);
			return { weekList, cols };
		})()
	);

	// ---- Zeitbasierte Kalenderansicht (Blöcke nach echter Start-Zeit + Dauer) ----
	const PX_PER_MIN = 1.1;

	// Filter der geplanten Prüfungen (Logik in $lib/exam/examFilter, unit-getestet).
	// Die Toggle-Variablen stehen hier in der $:-Anweisung, damit sie getrackt werden.
	let plannedFiltered = $derived(
		filterPlanned(data.plannedExams, {
			onlyMine: onlyPlannedByMe,
			program: showExam,
			examerID: showExamerID,
			ancode: showAncode,
			onlyOnline: showOnlyOnline,
			onlyExahm: showOnlyExahm
		})
	);

	let timeCal = $derived(
		(() => {
			const items = [];
			for (const e of plannedFiltered) {
				// Nur Prüfungen innerhalb des Zeitraums: Out-of-Period-Prüfungen haben zwar
				// eine starttime, gehören aber mangels echtem Prüfungstag nicht in den Plan.
				if (!inPeriod(e.planEntry?.starttime, data.semesterConfig?.days)) continue;
				const iso = e.planEntry?.starttime;
				const dt = dateObj(iso);
				const startMin = minutesOfDay(iso);
				if (!dt || startMin == null) continue;
				const dur = e.maxDuration || e.zpaExam?.duration || 60;
				items.push({ e, dt, startMin, endMin: startMin + dur, dur });
			}
			if (!items.length) return { weekList: [], cols: [], min: 480, max: 600, hours: [] };
			const min = Math.floor(Math.min(...items.map((x) => x.startMin)) / 60) * 60;
			const max = Math.ceil(Math.max(...items.map((x) => x.endMin)) / 60) * 60;
			/** @type {Map<string, any>} */
			const weeks = new Map();
			/** @type {Set<number>} */
			const usedWd = new Set();
			for (const x of items) {
				const wd = isoWeekday(x.dt);
				usedWd.add(wd);
				const mon = mondayOf(x.dt);
				const key = mon.toISOString().slice(0, 10);
				if (!weeks.has(key))
					weeks.set(key, { monday: mon, weekNum: isoWeekNum(x.dt), byWd: new Map() });
				const w = weeks.get(key);
				if (!w.byWd.has(wd)) w.byWd.set(wd, []);
				w.byWd.get(wd).push(x);
			}
			// Überlappende Prüfungen eines Tages in Spalten aufteilen (greedy).
			for (const w of weeks.values()) {
				for (const [wd, arr] of w.byWd) {
					arr.sort(
						(/** @type {any} */ a, /** @type {any} */ b) =>
							a.startMin - b.startMin || a.endMin - b.endMin
					);
					/** @type {number[]} */
					const colEnds = [];
					for (const x of arr) {
						let c = colEnds.findIndex((end) => end <= x.startMin);
						if (c === -1) {
							c = colEnds.length;
							colEnds.push(x.endMin);
						} else colEnds[c] = x.endMin;
						x.col = c;
					}
					w.byWd.set(wd, { items: arr, ncols: colEnds.length || 1 });
				}
			}
			const cols = [1, 2, 3, 4, 5].concat([6, 7].filter((d) => usedWd.has(d)));
			const weekList = [...weeks.values()].sort(
				(/** @type {any} */ a, /** @type {any} */ b) => a.monday.getTime() - b.monday.getTime()
			);
			const hours = [];
			for (let h = min; h <= max; h += 60) hours.push(h);
			return { weekList, cols, min, max, hours };
		})()
	);

	/** @param {any} x → Zustands-Akzent für einen Zeit-Block */
	const blockColor = (x) => {
		if (x.e.constraints?.notPlannedByMe) return 'border-l-base-content/30 border-dashed opacity-70';
		if (x.e.planEntry?.phaseFixed) return 'border-l-info';
		if (x.e.planEntry?.locked) return 'border-l-base-content/40';
		// Wiederholung: Farbe wie in der Slotansicht (border-l-warning + bg-warning/10)
		if (x.e.zpaExam?.isRepeaterExam) return 'border-l-warning bg-warning/10';
		// Normalfall: gleiche Farbe wie in der Slotansicht (border-l-success/60)
		return 'border-l-success/60';
	};
	// FK-Formatierung zentral in $lib/exam/fk (unit-getestet).
	// Externe Prüfungen (zpaExam.faculty gesetzt; leer ⇒ FK07) über faculty +
	// Primuss-Ancode darstellen, z. B. „FK03: 123".
	/** @param {any} z zpaExam */
	const fmtAncode = (z) =>
		displayAncode(normalizeFk(z.faculty), z.primussAncodes?.[0]?.ancode, z.ancode);

	// planende FK: Fakultät zuerst, sonst Constraint-Feld.
	/** @param {any} e */
	const otherFk = (e) => planningFk(e.zpaExam?.faculty, e.constraints?.notPlannedByMeInFK);

	// „FK10: 456" — FK-Präfix + Primuss-Ancode, wie in den Slot-Kästchen.
	/** @param {any} e */
	const otherFkAncode = (e) =>
		displayAncode(
			otherFk(e),
			e.zpaExam?.primussAncodes?.[0]?.ancode,
			e.zpaExam?.ancode ?? e.ancode
		);

	/** @param {string|null|undefined} iso → „Mo 06.07. 11:00" (Berlin) */
	const fmtDateTime = (iso) => {
		if (!iso) return '';
		const d = new Date(iso);
		return Number.isNaN(d.getTime())
			? ''
			: d.toLocaleString('de-DE', {
					timeZone: 'Europe/Berlin',
					weekday: 'short',
					day: '2-digit',
					month: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});
	};

	// „von anderen FKs geplant" OHNE echten Slot: out-of-period (Zeit in starttime,
	// aber kein Prüfungstag) oder noch ganz ohne Zeit. Die MIT echtem Slot erscheinen
	// bereits im Raster/in der Zeit-Ansicht und werden hier nicht dupliziert.
	let otherFkNoSlot = $derived(
		(data.otherFkExams ?? [])
			.filter(
				(/** @type {any} */ e) => !inPeriod(e.planEntry?.starttime, data.semesterConfig?.days)
			)
			.sort((/** @type {any} */ a, /** @type {any} */ b) => a.ancode - b.ancode)
	);

	function forbiddenSlot(/** @type {any} */ day, /** @type {any} */ time) {
		const key = `${day},${time}`;
		return data.globalSlotStatus.get(key) === 'forbidden';
	}

	function unplannedExams(/** @type {any} */ program) {
		let count = 0;
		for (const exam of examsWithoutSlot) {
			if (exam.constraints && exam.constraints.notPlannedByMe) {
				continue;
			}
			if (
				exam.primussExams.some(
					(/** @type {any} */ primussExam) =>
						primussExam.exam.program === program && primussExam.studentRegs.length > 0
				)
			) {
				count++;
			}
		}
		return count;
	}
</script>

{#if !data.semesterConfig}
	<NoSemesterConfig />
{:else}
	<div class="mx-2 mt-4 flex flex-col gap-4">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-semibold">Prüfungsplan</h1>
			<div class="join">
				<button
					class="btn join-item btn-sm {view === 'kalender' ? 'btn-primary' : 'btn-ghost'}"
					onclick={() => (view = 'kalender')}>🗓 Slots</button
				>
				<button
					class="btn join-item btn-sm {view === 'zeit' ? 'btn-primary' : 'btn-ghost'}"
					onclick={() => (view = 'zeit')}>⏱ Zeit</button
				>
			</div>
			{#if selectedExam !== -1}
				<span class="flex items-center gap-1 text-sm text-base-content/60">
					Ancode <span class="font-mono">{selectedExam}</span> gewählt:
					<span class="badge badge-success badge-sm">erlaubt</span>
					<span class="badge badge-warning badge-sm">ungünstig</span>
					<span class="badge badge-error badge-sm">verboten</span>
				</span>
			{/if}
		</div>

		<!-- Platzierungsleiste: bei gewählter Prüfung „＋ hier" im Slot oder freie Zeit -->
		{#if selectedExam !== -1}
			<div class="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
				<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
					<span class="font-medium">
						Ancode <span class="font-mono">{selectedExam}</span> platzieren:
					</span>
					<span class="text-base-content/60">
						auf „＋ hier" in einem Slot klicken — oder freie Zeit setzen:
					</span>
					<input type="date" class="input input-bordered input-xs w-36" bind:value={placeDate} />
					<input type="time" class="input input-bordered input-xs w-24" bind:value={placeTime} />
					<button
						class="btn btn-primary btn-xs"
						disabled={placeBusy || !placeDate || !placeTime}
						onclick={() => submitFreeTime(false)}
					>
						{placeBusy ? '…' : 'setzen'}
					</button>
					<button class="btn btn-ghost btn-xs" onclick={handleUnselect}>Auswahl aufheben</button>
				</div>
				{#if nonStandard}
					<div class="flex flex-wrap items-center gap-2">
						<span class="badge badge-warning badge-sm">keine Standard-Anfangszeit</span>
						<span class="text-base-content/60">
							{placeTime} ist keine der Anfangszeiten des Semesters.
						</span>
						<button
							class="btn btn-warning btn-xs"
							disabled={placeBusy}
							onclick={() => submitFreeTime(true)}
						>
							trotzdem übernehmen
						</button>
					</div>
				{/if}
				{#if placeError}<div class="text-xs text-error">{placeError}</div>{/if}
			</div>
		{/if}

		<!-- Filter-Toolbar -->
		<div
			class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-base-300 bg-base-100 p-3 text-sm"
		>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={onlyPlannedByMe} /> nur eigene
			</label>
			<label
				class="flex items-center gap-2 {view === 'zeit'
					? 'cursor-not-allowed opacity-40'
					: 'cursor-pointer'}"
				title={view === 'zeit' ? 'in der Zeitansicht ohne Wirkung' : undefined}
			>
				<input
					type="checkbox"
					class="toggle toggle-sm"
					bind:checked={onlyConflicts}
					disabled={view === 'zeit'}
				/> nur Konflikte
			</label>
			<label
				class="flex items-center gap-2 {view === 'zeit'
					? 'cursor-not-allowed opacity-40'
					: 'cursor-pointer'}"
				title={view === 'zeit' ? 'in der Zeitansicht ohne Wirkung' : undefined}
			>
				<input
					type="checkbox"
					class="toggle toggle-sm"
					bind:checked={details}
					disabled={view === 'zeit'}
				/> Details
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={showOnlyExahm} /> EXaHM/SEB
			</label>
			<label
				class="flex items-center gap-2 {view === 'zeit'
					? 'cursor-not-allowed opacity-40'
					: 'cursor-pointer'}"
				title={view === 'zeit' ? 'in der Zeitansicht ohne Wirkung' : undefined}
			>
				<input
					type="checkbox"
					class="toggle toggle-sm"
					bind:checked={showOnlyEXaHMRooms}
					disabled={view === 'zeit'}
				/> EXaHM-Räume
			</label>
			<label
				class="flex items-center gap-2 {view === 'zeit'
					? 'cursor-not-allowed opacity-40'
					: 'cursor-pointer'}"
				title={view === 'zeit' ? 'in der Zeitansicht ohne Wirkung' : undefined}
			>
				<input
					type="checkbox"
					class="toggle toggle-sm"
					bind:checked={showMucdaiSlots}
					onchange={handleMucdaiSlots}
					disabled={view === 'zeit'}
				/> MUC.DAI-Slots
			</label>
			<div class="flex-1"></div>
			<select class="select select-bordered select-sm" bind:value={showExam}>
				<option value="all">Alle Gruppen</option>
				{#each allProgramsInPlan as program}
					{@const count = unplannedExams(program)}
					<option value={program}
						>{program}{#if count > 0}
							({count} offen){/if}</option
					>
				{/each}
			</select>
			<select class="select select-bordered select-sm" bind:value={showExamerID}>
				<option value="all">Alle Prüfende</option>
				{#each allExamer as examer}
					<option value={examer.mainExamerID}>{examer.mainExamer}</option>
				{/each}
			</select>
			<select class="select select-bordered select-sm" bind:value={showAncode}>
				<option value="0">Alle Ancodes</option>
				{#each allAncodes as ancode}
					<option>{ancode}</option>
				{/each}
			</select>
		</div>

		<!-- Slot-Zelle: in beiden Ansichten identisch (eigenes Fetching + Events) -->
		{#snippet slotCell(/** @type {any} */ day, /** @type {any} */ time)}
			<div
				class="h-full rounded {statusColor(
					slotsStatus[`${day.number},${time.number}`]
				)} {globalForbiddenSlot(day.number, time.number) ?? ''} {mucdaiSlotToShow[
					`${day.number},${time.number}`
				] ?? ''}"
			>
				<Slot
					{day}
					{time}
					forbiddenSlot={forbiddenSlot(day.number, time.number)}
					exahmrooms={(data.roomsForSlots.get(`${day.number},${time.number}`) ?? []).filter(
						(/** @type {any} */ r) => r.exahm
					)}
					{maxSlots}
					{selectedExam}
					{selectedExamerID}
					{onlyPlannedByMe}
					{onlyConflicts}
					{details}
					{moveable}
					{showExam}
					{showAncode}
					{showExamerID}
					{showOnlyOnline}
					{showOnlyExahm}
					{showOnlySEB}
					{showOnlyEXaHMRooms}
					{conflictingAncodes}
					refresh={refresh[`${day.number},${time.number}`]}
					onselected={handleSelect}
					onunselected={handleUnselect}
					onplace={handlePlace}
				/>
			</div>
		{/snippet}

		<!-- Nach einer Platzierung (placeNonce++) baut {#key} das Raster + die Listen neu
		     auf, damit die Slots (die ihre Prüfungen selbst laden) frisch holen. -->
		{#key placeNonce}
			{#if view === 'kalender'}
				<div class="flex flex-col gap-6">
					{#each weeks.weekList as w}
						<div class="flex flex-col gap-1">
							<div class="text-sm font-semibold text-base-content/70">KW {w.weekNum}</div>
							<div class="overflow-x-auto rounded-lg border border-base-300">
								<table class="table table-sm w-full">
									<thead>
										<tr>
											<th class="w-16 bg-base-200"></th>
											{#each weeks.cols as wd}
												{@const d = w.byWd.get(wd)}
												<th class="bg-base-200 text-center">
													<div>{WD2[wd]}</div>
													{#if d}
														<div class="text-xs font-normal text-base-content/60">
															#{d.number} · {ddmm(/** @type {Date} */ (dateObj(d.date)))}
														</div>
													{/if}
												</th>
											{/each}
										</tr>
									</thead>
									<tbody>
										{#each data.semesterConfig.starttimes as time}
											<tr>
												<td class="bg-base-200 text-center align-top text-xs tabular-nums">
													<div class="font-semibold">{time.start}</div>
													<div class="text-base-content/50">#{time.number}</div>
												</td>
												{#each weeks.cols as wd}
													{@const d = w.byWd.get(wd)}
													<td class="align-top">
														{#if d}{@render slotCell(d, time)}{/if}
													</td>
												{/each}
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/each}
				</div>
			{:else if !timeCal.weekList.length}
				<div class="text-sm text-base-content/50">Keine geplanten Prüfungen mit Zeit.</div>
			{:else}
				<div class="flex flex-col gap-6">
					{#each timeCal.weekList as w}
						<div class="flex flex-col gap-1">
							<div class="text-sm font-semibold text-base-content/70">KW {w.weekNum}</div>
							<div class="overflow-x-auto">
								<div class="flex gap-2" style="min-width:max-content">
									<div
										class="relative w-12 shrink-0"
										style="height:{(timeCal.max - timeCal.min) * PX_PER_MIN}px"
									>
										{#each timeCal.hours as h}
											<div
												class="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-base-content/50"
												style="top:{(h - timeCal.min) * PX_PER_MIN}px"
											>
												{hhmm(h)}
											</div>
										{/each}
									</div>
									{#each timeCal.cols as wd}
										{@const dd = w.byWd.get(wd)}
										<div class="flex-1" style="min-width:11rem">
											<div class="mb-1 text-center text-xs font-medium text-base-content/60">
												{WD2[wd]}{#if dd}
													· {ddmm(dd.items[0].dt)}{/if}
											</div>
											<div
												class="relative rounded border border-base-200 bg-base-100"
												style="height:{(timeCal.max - timeCal.min) * PX_PER_MIN}px"
											>
												{#each timeCal.hours as h}
													<div
														class="absolute inset-x-0 border-t border-base-200/70"
														style="top:{(h - timeCal.min) * PX_PER_MIN}px"
													></div>
												{/each}
												{#if dd}
													{#each dd.items as x}
														<div
															class="absolute overflow-hidden rounded border border-l-4 border-base-300 bg-base-100 p-1 shadow-sm {blockColor(
																x
															)}"
															style="top:{(x.startMin - timeCal.min) *
																PX_PER_MIN}px; height:{x.dur * PX_PER_MIN}px; left:calc({(x.col /
																dd.ncols) *
																100}% + 2px); width:calc({100 / dd.ncols}% - 4px)"
															title="{fmtAncode(x.e.zpaExam)} · {x.e.zpaExam.module} ({x.e.zpaExam
																.mainExamer}) · {hhmm(x.startMin)}–{hhmm(
																x.endMin
															)} · {x.dur} Min · ∑{x.e.studentRegsCount}"
														>
															<div
																class="flex items-center gap-1 text-[11px] font-semibold leading-tight"
															>
																<span class="font-mono">{fmtAncode(x.e.zpaExam)}</span>
																<!-- Status-Icons rechts, damit die Ancodes links bündig stehen -->
																<span class="ml-auto flex items-center gap-0.5">
																	{#if x.e.planEntry?.locked}<span title="manuell gesperrt">🔒</span
																		>{/if}
																	{#if x.e.planEntry?.phaseFixed}<span title="Raumphase fixiert"
																			>🏗️</span
																		>{/if}
																	{#if x.e.zpaExam?.isRepeaterExam}<span title="Wiederholung"
																			>🔁</span
																		>{/if}
																</span>
															</div>
															<div class="truncate text-[10px] leading-tight">
																{x.e.zpaExam.module}
															</div>
															<div
																class="text-[10px] leading-tight tabular-nums text-base-content/60"
															>
																{hhmm(x.startMin)} · {x.dur}′ · ∑{x.e.studentRegsCount}
															</div>
														</div>
													{/each}
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<ExamsWithoutSlot
				{examsWithoutSlot}
				{maxSlots}
				{showExam}
				{showAncode}
				{showExamerID}
				{showOnlyOnline}
				{showOnlyExahm}
				{showOnlySEB}
				{selectedExam}
				{selectedExamerID}
				{onlyPlannedByMe}
				{details}
				{moveable}
				{conflictingAncodes}
				onselected={handleSelect}
				onunselected={handleUnselect}
			/>

			{#if otherFkNoSlot.length}
				<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-200 p-3">
					<div class="flex items-center gap-2">
						<h2 class="text-lg font-semibold">Von anderen FKs geplant (ohne Slot)</h2>
						<span class="badge badge-neutral badge-sm tabular-nums">{otherFkNoSlot.length}</span>
					</div>
					<p class="text-sm text-base-content/60">
						Diese Prüfungen plant eine andere Fakultät — sie bekommen von dir keinen Slot. Sobald
						sie eine Zeit haben, erscheinen sie zur Konflikt-Übersicht an ihrer Zeit im Raster.
						Zeiten setzt du unter <a href="/exam/external" class="link link-primary"
							>Prüfungen anderer FKs</a
						>.
					</p>
					<div class="flex flex-wrap gap-2">
						{#each otherFkNoSlot as e (e.ancode)}
							{@const t = fmtDateTime(e.planEntry?.starttime)}
							<div
								class="flex flex-col gap-0.5 rounded-md border border-l-4 border-dashed border-base-300 border-l-base-content/30 bg-base-200 p-2 text-xs opacity-90"
							>
								<div class="flex items-center gap-1 font-semibold">
									<span class="font-mono">{otherFkAncode(e)}</span>
									{#if e.zpaExam?.isRepeaterExam}<span class="ml-auto" title="Wiederholung">🔁</span
										>{/if}
								</div>
								<div class="truncate">{e.zpaExam?.module}</div>
								<div class="text-base-content/50">
									{e.zpaExam?.mainExamer} · ∑{e.studentRegsCount}
								</div>
								{#if t}
									<div class="tabular-nums text-base-content/70">
										{t} Uhr <span class="text-base-content/40">(außerhalb Zeitraum)</span>
									</div>
								{:else}
									<div class="text-warning">noch keine Zeit</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/key}
	</div>
{/if}
