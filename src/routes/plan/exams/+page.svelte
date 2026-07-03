<script>
	export let data;
	import Slot from '$lib/slot/Slot.svelte';
	import ExamsWithoutSlot from '$lib/examsInPlan/ExamsWithoutSlot.svelte';
	import NoSemesterConfig from '$lib/config/NoSemesterConfig.svelte';
	import { onMount } from 'svelte';

	let examsWithoutSlot = data.examsWithoutSlot ?? [];

	let onlyPlannedByMe = true;
	let details = false;
	let moveable = false;

	let maxSlots =
		(data.semesterConfig?.days?.length ?? 0) * (data.semesterConfig?.starttimes?.length ?? 0);

	// // status can be
	// // unknown
	// // allowed
	// // forbidden
	// // awkward

	let onlyConflicts = true;

	let showExam = 'all';
	let showAncode = '0';
	let showExamerID = 'all';
	let showOnlyOnline = false;
	let showOnlyExahm = false;
	let showOnlySEB = false;
	let showOnlyEXaHMRooms = false;
	let showMucdaiSlots = false;

	let allProgramsInPlan = [];
	async function getPrograms() {
		const response = await fetch('/api/allProgramsInPlan', {
			method: 'GET'
		});

		allProgramsInPlan = await response.json();
	}
	let allAncodes = [];
	async function getAncodes() {
		const response = await fetch('/api/ancodesInPlan', {
			method: 'GET'
		});

		allAncodes = await response.json();
	}
	let allExamer = [];
	async function getExamer() {
		const response = await fetch('/api/examerInPlan', {
			method: 'GET'
		});

		allExamer = await response.json();
	}

	let slotsStatus = new Map();

	function initSlotsStatus(status) {
		for (let day of data.semesterConfig?.days ?? []) {
			for (let time of data.semesterConfig?.starttimes ?? []) {
				slotsStatus[[day.number, time.number]] = status;
			}
		}
	}

	let refresh = new Map();

	function initRefresh() {
		for (let day of data.semesterConfig?.days ?? []) {
			for (let time of data.semesterConfig?.starttimes ?? []) {
				refresh[[day.number, time.number]] = false;
			}
		}
	}

	function statusColor(status) {
		if (status == 'allowed') return 'bg-success/20';
		if (status == 'awkward') return 'bg-warning/30';
		if (status == 'forbidden') return 'bg-error/15';
		return '';
	}

	let mucdaiSlot = new Map();

	for (const slot of data.semesterConfig?.mucDaiSlots ?? []) {
		mucdaiSlot[[slot.dayNumber, slot.slotNumber]] = 'rounded ring-2 ring-error/70';
	}

	let mucdaiSlotToShow = new Map();

	function handleMucdaiSlots() {
		if (showMucdaiSlots) {
			mucdaiSlotToShow = mucdaiSlot;
		} else {
			mucdaiSlotToShow = new Map();
		}
	}

	// let examGroupsWithoutSlot = [];
	// async function fetchExamGroupsWithoutSlot() {
	// 	const response = await fetch('/api/examGroupsWithoutSlot', {
	// 		method: 'GET',
	// 		headers: {
	// 			'content-type': 'application/json'
	// 		}
	// 	});
	// 	let data = await response.json();
	// 	examGroupsWithoutSlot = data.examGroupsWithoutSlot;
	// 	examGroupsWithoutSlot.sort(
	// 		(g1, g2) => g2.examGroupInfo.studentRegs - g1.examGroupInfo.studentRegs
	// 	);
	// }

	onMount(() => {
		// 	initSlotsStatus('unknown');
		// 	initRefresh();
		getPrograms();
		getAncodes();
		getExamer();
		// 	fetchExamGroupsWithoutSlot();
	});

	let selectedExam = -1;
	let conflictingAncodes = [];
	let selectedExamerID = -1;

	async function handleSelect(event) {
		initSlotsStatus('forbidden');
		selectedExam = event.detail.ancode;
		selectedExamerID = event.detail.mainExamerID;
		let allowedSlots = await fetchAllowedSlots(event.detail.ancode);
		for (let slot of allowedSlots) {
			slotsStatus[[slot.dayNumber, slot.slotNumber]] = 'allowed';
		}
		let akwardSlots = await fetchAwkwardSlots(event.detail.ancode);
		for (let slot of akwardSlots) {
			if (slotsStatus[[slot.dayNumber, slot.slotNumber]] == 'allowed') {
				slotsStatus[[slot.dayNumber, slot.slotNumber]] = 'awkward';
			}
		}
		let res = await fetchconflictingAncodes(event.detail.ancode);
		conflictingAncodes = res.map((conflict) => conflict.ancode);
	}

	async function handleUnselect(event) {
		initSlotsStatus('unknown');
		selectedExam = -1;
		selectedExamerID = -1;
		conflictingAncodes = [];
	}

	async function handleAddToSlot(event) {
		// 	let success = await addToSlot(event.detail);
		// 	if (success) {
		// 		refresh[[event.detail.slot.dayNumber, event.detail.slot.slotNumber]] = true;
		// 		if (event.detail.oldslot) {
		// 			refresh[[event.detail.oldslot.dayNumber, event.detail.oldslot.slotNumber]] = true;
		// 		} else {
		// 			fetchExamGroupsWithoutSlot();
		// 		}
		// 	}
	}

	async function handleRmFromSlot(event) {
		// 	let success = await rmFromSlot(event.detail);
		// 	if (success) {
		// 		refresh[[event.detail.slot.dayNumber, event.detail.slot.slotNumber]] = true;
		// 		fetchExamGroupsWithoutSlot();
		// 	}
	}

	async function addToSlot(args) {
		// 	const response = await fetch('/api/slot/addToSlot', {
		// 		method: 'POST',
		// 		body: JSON.stringify(args),
		// 		headers: {
		// 			'content-type': 'application/json'
		// 		}
		// 	});
		// 	let data = await response.json();
		// 	return data.addExamGroupToSlot;
	}

	async function rmFromSlot(args) {
		// 	const response = await fetch('/api/slot/rmFromSlot', {
		// 		method: 'POST',
		// 		body: JSON.stringify(args),
		// 		headers: {
		// 			'content-type': 'application/json'
		// 		}
		// 	});
		// 	let data = await response.json();
		// 	return data.rmExamGroupFromSlot;
	}

	async function fetchAllowedSlots(ancode) {
		const response = await fetch('/api/allowedSlots', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.allowedSlots;
	}

	async function fetchAwkwardSlots(ancode) {
		const response = await fetch('/api/awkwardSlots', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.awkwardSlots;
	}

	async function fetchconflictingAncodes(ancode) {
		const response = await fetch('/api/conflictingAncodes', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		return data.conflictingAncodes;
	}

	function globalForbiddenSlot(day, time) {
		const key = `${day},${time}`;
		if (data.globalSlotStatus.get(key) === 'forbidden') {
			return 'bg-base-300';
		}
	}

	// ---- Ansicht (Kalender nach Wochen ↔ Raster Tage×Zeiten) ----
	let view = 'kalender';
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
		d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3);
		const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
		firstThu.setUTCDate(firstThu.getUTCDate() - ((firstThu.getUTCDay() + 6) % 7) + 3);
		return 1 + Math.round((d.getTime() - firstThu.getTime()) / 604800000);
	}
	/** @param {Date} dt */
	const ddmm = (dt) =>
		`${String(dt.getUTCDate()).padStart(2, '0')}.${String(dt.getUTCMonth() + 1).padStart(2, '0')}.`;

	// Tage nach ISO-Woche gruppieren; Spalten Mo–Fr (+Sa/So falls genutzt).
	$: weeks = (() => {
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
	})();

	// ---- Zeitbasierte Kalenderansicht (Blöcke nach echter Start-Zeit + Dauer) ----
	const PX_PER_MIN = 1.1;
	/** @param {string} iso → Minuten seit Mitternacht (Wanduhr aus dem ISO-Offset) */
	const minutesOfDay = (iso) => {
		const m = /T(\d{2}):(\d{2})/.exec(String(iso ?? ''));
		return m ? +m[1] * 60 + +m[2] : null;
	};
	/** @param {number} min → „08:30" */
	const hhmm = (min) =>
		`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

	// Filter der geplanten Prüfungen für die Zeit-Ansicht. Alle Toggle-Variablen
	// als Parameter, damit die reaktive Anweisung sie trackt.
	/**
	 * @param {any[]} list @param {boolean} onlyMine @param {string} prog
	 * @param {string|number} examerID @param {string|number} anc
	 * @param {boolean} onlyOnline @param {boolean} onlyExahm
	 */
	function filterPlanned(list, onlyMine, prog, examerID, anc, onlyOnline, onlyExahm) {
		return (list ?? []).filter((/** @type {any} */ e) => {
			const c = e.constraints;
			if (onlyMine && c?.notPlannedByMe) return false;
			const progs = (e.primussExams ?? [])
				.filter((/** @type {any} */ p) => (p.studentRegs?.length ?? 0) > 0)
				.map((/** @type {any} */ p) => p.exam.program);
			let show = prog === 'all' ? true : progs.includes(prog);
			if (examerID !== 'all') show = show && e.zpaExam.mainExamerID == examerID;
			if (anc !== '0') show = show && e.ancode == anc;
			if (onlyOnline) show = !!c?.online;
			if (onlyExahm) show = !!(c?.roomConstraints?.exahm || c?.roomConstraints?.seb);
			return show;
		});
	}
	$: plannedFiltered = filterPlanned(
		data.plannedExams,
		onlyPlannedByMe,
		showExam,
		showExamerID,
		showAncode,
		showOnlyOnline,
		showOnlyExahm
	);

	$: timeCal = (() => {
		const items = [];
		for (const e of plannedFiltered) {
			// Nur echte Slots (1-basiert): externe Out-of-Period-Prüfungen (Slot 0/0)
			// liefern zwar ihre externalTime als starttime, gehören aber mangels Slot
			// nicht in den Plan.
			if (!e.planEntry?.slotNumber) continue;
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
			if (!weeks.has(key)) weeks.set(key, { monday: mon, weekNum: isoWeekNum(x.dt), byWd: new Map() });
			const w = weeks.get(key);
			if (!w.byWd.has(wd)) w.byWd.set(wd, []);
			w.byWd.get(wd).push(x);
		}
		// Überlappende Prüfungen eines Tages in Spalten aufteilen (greedy).
		for (const w of weeks.values()) {
			for (const [wd, arr] of w.byWd) {
				arr.sort(
					(/** @type {any} */ a, /** @type {any} */ b) => a.startMin - b.startMin || a.endMin - b.endMin
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
	})();

	/** @param {any} x → Zustands-Akzent für einen Zeit-Block */
	const blockColor = (x) => {
		if (x.e.constraints?.notPlannedByMe) return 'border-l-base-content/30 border-dashed opacity-70';
		if (x.e.planEntry?.phaseFixed) return 'border-l-info';
		if (x.e.planEntry?.locked) return 'border-l-base-content/40';
		if (x.e.zpaExam?.isRepeaterExam) return 'border-l-warning';
		return 'border-l-primary';
	};
	// Externe Prüfungen (zpaExam.faculty gesetzt; leer ⇒ FK07) über faculty +
	// Primuss-Ancode darstellen, z. B. „FK03: 123".
	/** @param {any} z zpaExam */
	const fmtAncode = (z) =>
		z.faculty ? `${z.faculty}: ${z.primussAncodes?.[0]?.ancode ?? z.ancode}` : z.ancode.toString();

	// planende FK: Fakultät zuerst, sonst Constraint-Feld; rein numerisch → „FK…"
	/** @param {any} e */
	const otherFk = (e) => {
		const raw = e.zpaExam?.faculty || e.constraints?.notPlannedByMeInFK || '';
		return /^\d+$/.test(raw) ? `FK${raw}` : raw;
	};

	// „FK10: 456" — FK-Präfix + Primuss-Ancode, wie in den Slot-Kästchen.
	/** @param {any} e */
	const otherFkAncode = (e) => {
		const fk = otherFk(e);
		const a = e.zpaExam?.primussAncodes?.[0]?.ancode ?? e.zpaExam?.ancode ?? e.ancode;
		return fk ? `${fk}: ${a}` : String(a);
	};

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

	// „von anderen FKs geplant" OHNE echten Slot: Slot 0/0 (out-of-period, nur
	// externalTime) oder noch ganz ohne Zeit. Die MIT echtem Slot erscheinen bereits
	// im Raster/in der Zeit-Ansicht und werden hier nicht dupliziert.
	$: otherFkNoSlot = (data.otherFkExams ?? [])
		.filter(
			(/** @type {any} */ e) => !(e.planEntry?.dayNumber > 0 && e.planEntry?.slotNumber > 0)
		)
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.ancode - b.ancode);

	function forbiddenSlot(day, time) {
		const key = `${day},${time}`;
		return data.globalSlotStatus.get(key) === 'forbidden';
	}

	function unplannedExams(program) {
		let count = 0;
		for (const exam of examsWithoutSlot) {
			if (exam.constraints && exam.constraints.notPlannedByMe) {
				continue;
			}
			if (
				exam.primussExams.some(
					(primussExam) =>
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
					on:click={() => (view = 'kalender')}>🗓 Slots</button
				>
				<button
					class="btn join-item btn-sm {view === 'zeit' ? 'btn-primary' : 'btn-ghost'}"
					on:click={() => (view = 'zeit')}>⏱ Zeit</button
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

		<!-- Filter-Toolbar -->
		<div
			class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-base-300 bg-base-100 p-3 text-sm"
		>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={onlyPlannedByMe} /> nur eigene
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={onlyConflicts} /> nur Konflikte
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={details} /> Details
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={moveable} /> veränderbar
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={showOnlyOnline} /> online
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={showOnlyExahm} /> EXaHM/SEB
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={showOnlyEXaHMRooms} /> EXaHM-Räume
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					class="toggle toggle-sm"
					bind:checked={showMucdaiSlots}
					on:change={handleMucdaiSlots}
				/> MUC.DAI-Slots
			</label>
			<div class="flex-1"></div>
			<select class="select select-bordered select-sm" bind:value={showExam}>
				<option value="all">Alle Gruppen</option>
				{#each allProgramsInPlan as program}
					{@const count = unplannedExams(program)}
					<option value={program}>{program}{#if count > 0} ({count} offen){/if}</option>
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
				class="h-full rounded {statusColor(slotsStatus[[day.number, time.number]])} {globalForbiddenSlot(
					day.number,
					time.number
				) ?? ''} {mucdaiSlotToShow[[day.number, time.number]] ?? ''}"
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
					refresh={refresh[[day.number, time.number]]}
					on:selected={handleSelect}
					on:unselected={handleUnselect}
					on:addToSlot={handleAddToSlot}
					on:rmFromSlot={handleRmFromSlot}
				/>
			</div>
		{/snippet}

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
														#{d.number} · {ddmm(dateObj(d.date))}
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
		{:else}
			{#if !timeCal.weekList.length}
				<div class="text-sm text-base-content/50">Keine geplanten Prüfungen mit Zeit.</div>
			{:else}
				<div class="flex flex-col gap-6">
					{#each timeCal.weekList as w}
						<div class="flex flex-col gap-1">
							<div class="text-sm font-semibold text-base-content/70">KW {w.weekNum}</div>
							<div class="overflow-x-auto">
								<div class="flex gap-2" style="min-width:max-content">
									<div class="relative w-12 shrink-0" style="height:{(timeCal.max - timeCal.min) * PX_PER_MIN}px">
										{#each timeCal.hours as h}
											<div class="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-base-content/50" style="top:{(h - timeCal.min) * PX_PER_MIN}px">{hhmm(h)}</div>
										{/each}
									</div>
									{#each timeCal.cols as wd}
										{@const dd = w.byWd.get(wd)}
										<div class="flex-1" style="min-width:11rem">
											<div class="mb-1 text-center text-xs font-medium text-base-content/60">{WD2[wd]}{#if dd} · {ddmm(dd.items[0].dt)}{/if}</div>
											<div class="relative rounded border border-base-200 bg-base-100" style="height:{(timeCal.max - timeCal.min) * PX_PER_MIN}px">
												{#each timeCal.hours as h}
													<div class="absolute inset-x-0 border-t border-base-200/70" style="top:{(h - timeCal.min) * PX_PER_MIN}px"></div>
												{/each}
												{#if dd}
													{#each dd.items as x}
														<div
															class="absolute overflow-hidden rounded border border-l-4 border-base-300 bg-base-100 p-1 shadow-sm {blockColor(x)}"
															style="top:{(x.startMin - timeCal.min) * PX_PER_MIN}px; height:{x.dur * PX_PER_MIN}px; left:calc({(x.col / dd.ncols) * 100}% + 2px); width:calc({100 / dd.ncols}% - 4px)"
															title="{fmtAncode(x.e.zpaExam)} · {x.e.zpaExam.module} ({x.e.zpaExam.mainExamer}) · {hhmm(x.startMin)}–{hhmm(x.endMin)} · {x.dur} Min · ∑{x.e.studentRegsCount}"
														>
															<div class="flex items-center gap-1 text-[11px] font-semibold leading-tight">
																{#if x.e.planEntry?.locked}<span title="manuell gesperrt">🔒</span>{/if}
																{#if x.e.planEntry?.phaseFixed}<span title="Raumphase fixiert">🏗️</span>{/if}
																{#if x.e.zpaExam?.isRepeaterExam}<span title="Wiederholung">🔁</span>{/if}
																<span class="font-mono">{fmtAncode(x.e.zpaExam)}</span>
															</div>
															<div class="truncate text-[10px] leading-tight">{x.e.zpaExam.module}</div>
															<div class="text-[10px] leading-tight tabular-nums text-base-content/60">{hhmm(x.startMin)} · {x.dur}′ · ∑{x.e.studentRegsCount}</div>
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
			{onlyConflicts}
			{details}
			{moveable}
			{conflictingAncodes}
			on:selected={handleSelect}
			on:unselected={handleUnselect}
			on:addToSlot={handleAddToSlot}
		/>

		{#if otherFkNoSlot.length}
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-200 p-3">
				<div class="flex items-center gap-2">
					<h2 class="text-lg font-semibold">Von anderen FKs geplant (ohne Slot)</h2>
					<span class="badge badge-neutral badge-sm tabular-nums">{otherFkNoSlot.length}</span>
				</div>
				<p class="text-sm text-base-content/60">
					Diese Prüfungen plant eine andere Fakultät — sie bekommen von dir keinen Slot. Sobald sie
					eine Zeit haben, erscheinen sie zur Konflikt-Übersicht an ihrer Zeit im Raster. Zeiten
					setzt du unter <a href="/plan/external" class="link link-primary">Prüfungen anderer FKs</a>.
				</p>
				<div class="flex flex-wrap gap-2">
					{#each otherFkNoSlot as e (e.ancode)}
						{@const t = fmtDateTime(e.planEntry?.starttime)}
						<div
							class="flex flex-col gap-0.5 rounded-md border border-l-4 border-dashed border-base-300 border-l-base-content/30 bg-base-200 p-2 text-xs opacity-90"
						>
							<div class="flex items-center gap-1 font-semibold">
								{#if e.zpaExam?.isRepeaterExam}<span title="Wiederholung">🔁</span>{/if}
								<span class="font-mono">{otherFkAncode(e)}</span>
							</div>
							<div class="truncate">{e.zpaExam?.module}</div>
							<div class="text-base-content/50">{e.zpaExam?.mainExamer} · ∑{e.studentRegsCount}</div>
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
	</div>
{/if}
