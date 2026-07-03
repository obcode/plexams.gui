<script>
	export let data;
	import Slot from '$lib/slot/Slot.svelte';
	import ExamsWithoutSlot from '$lib/examsInPlan/ExamsWithoutSlot.svelte';
	import NoSemesterConfig from '$lib/config/NoSemesterConfig.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';
	import { onMount } from 'svelte';

	let examsWithoutSlot = data.examsWithoutSlot ?? [];

	let onlyPlannedByMe = false;
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
					on:click={() => (view = 'kalender')}>🗓 Kalender</button
				>
				<button
					class="btn join-item btn-sm {view === 'raster' ? 'btn-primary' : 'btn-ghost'}"
					on:click={() => (view = 'raster')}>▦ Raster</button
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
			<div class="overflow-x-auto rounded-lg border border-base-300">
				<table class="table table-sm w-full">
					<thead>
						<tr>
							<th class="w-16 bg-base-200"></th>
							{#each data.semesterConfig.days as day}
								<th class="bg-base-200 text-center">
									<div>#{day.number}</div>
									<div class="text-xs font-normal text-base-content/60">{mkDateShort(day.date)}</div>
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
								{#each data.semesterConfig.days as day}
									<td class="align-top">{@render slotCell(day, time)}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
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
			{onlyConflicts}
			{details}
			{moveable}
			{conflictingAncodes}
			on:selected={handleSelect}
			on:unselected={handleUnselect}
			on:addToSlot={handleAddToSlot}
		/>
	</div>
{/if}
