<script>
	export let data;
	import { mkDateShort } from '$lib/jshelper/misc';

	const days = data.days;
	// mtknr -> NTA, to mark NTA students sitting in a room
	const ntaMap = new Map((data.ntas ?? []).map((/** @type {any} */ n) => [n.mtknr, n]));

	// Dropdown-Quellen: alle Prüfenden und alle tatsächlich verplanten NTAs
	/** @type {Map<number, string>} */
	const examinerMap = new Map();
	// id -> Anzeigename für alle wählbaren Personen (Aufsicht, Reserve, Prüfende)
	/** @type {Map<number, string>} */
	const teacherName = new Map();
	/** @type {Set<string>} */
	const presentNta = new Set();
	for (const day of days) {
		for (const s of day.slots) {
			if (s.slot?.reserve) teacherName.set(s.slot.reserve.id, s.slot.reserve.shortname);
			for (const r of s.slot?.roomsWithInvigilators ?? []) {
				if (r.invigilator) teacherName.set(r.invigilator.id, r.invigilator.shortname);
				for (const re of r.roomAndExams ?? []) {
					examinerMap.set(re.exam.mainExamerID, re.exam.mainExamer);
					teacherName.set(re.exam.mainExamerID, re.exam.mainExamer);
					for (const m of re.room.studentsInRoom ?? []) if (ntaMap.has(m)) presentNta.add(m);
				}
			}
		}
	}
	const examiners = [...examinerMap]
		.map(([id, name]) => ({ id, name }))
		.sort((a, b) => a.name.localeCompare(b.name));
	const ntaList = [...presentNta]
		.map((m) => ntaMap.get(m))
		.sort((a, b) => a.name.localeCompare(b.name));

	let open = days.map(() => false); // initial: alle Tage zu

	// Auswahl: entweder Person (Teacher-ID) oder NTA (mtknr) — wechselseitig exklusiv
	let selKind = ''; // '' | 'teacher' | 'nta'
	let selectedId = 0;
	let selectedNta = '';
	let selectedName = '';
	let examinerSel = 0;
	let ntaSel = '';

	/**
	 * @param {number} id
	 * @param {string} name
	 */
	function selectPerson(id, name) {
		if (selKind === 'teacher' && selectedId === id) return clearSel();
		selKind = 'teacher';
		selectedId = id;
		selectedNta = '';
		selectedName = name;
		examinerSel = examinerMap.has(id) ? id : 0;
		ntaSel = '';
		open = days.map((/** @type {any} */ d) => dayInvolves(d));
	}

	/** @param {string} mtknr */
	function selectNta(mtknr) {
		if (selKind === 'nta' && selectedNta === mtknr) return clearSel();
		selKind = 'nta';
		selectedNta = mtknr;
		selectedId = 0;
		selectedName = ntaMap.get(mtknr)?.name ?? mtknr;
		ntaSel = mtknr;
		examinerSel = 0;
		open = days.map((/** @type {any} */ d) => dayInvolves(d));
	}

	function clearSel() {
		selKind = '';
		selectedId = 0;
		selectedNta = '';
		selectedName = '';
		examinerSel = 0;
		ntaSel = '';
	}

	/** @param {boolean} v */
	function setAll(v) {
		open = open.map(() => v);
	}

	/**
	 * Selection signals are passed in (not closed over) so template calls
	 * re-evaluate when the selection changes.
	 * @param {any} r
	 * @param {string} kind
	 * @param {number} id
	 * @param {string} nta
	 */
	function roomInvolved(r, kind, id, nta) {
		if (kind === 'teacher') {
			if (r.invigilator && r.invigilator.id === id) return true;
			return (r.roomAndExams ?? []).some((/** @type {any} */ re) => re.exam.mainExamerID === id);
		}
		if (kind === 'nta') {
			return (r.roomAndExams ?? []).some((/** @type {any} */ re) =>
				(re.room.studentsInRoom ?? []).includes(nta)
			);
		}
		return false;
	}

	/**
	 * Opacity for a room card under the current selection (1 = normal, <1 = gedimmt).
	 * @param {any} r
	 * @param {string} kind
	 * @param {number} id
	 * @param {string} nta
	 * @param {boolean} slotHi
	 */
	function roomOpacity(r, kind, id, nta, slotHi) {
		if (slotHi) return 1;
		if (kind) return roomInvolved(r, kind, id, nta) ? 1 : 0.3;
		return r.name === 'No Room' ? 0.6 : 1;
	}

	/** @param {any} day */
	function dayInvolves(day) {
		for (const s of day.slots) {
			const slot = s.slot;
			if (!slot) continue;
			if (selKind === 'teacher' && slot.reserve && slot.reserve.id === selectedId) return true;
			for (const r of slot.roomsWithInvigilators ?? [])
				if (roomInvolved(r, selKind, selectedId, selectedNta)) return true;
		}
		return false;
	}

	/** @param {any} re */
	function ntaIn(re) {
		/** @type {any[]} */
		const out = [];
		for (const m of re.room.studentsInRoom ?? []) {
			const n = ntaMap.get(m);
			if (n) out.push(n);
		}
		return out;
	}

	/** @param {any} n */
	function ntaTitle(n) {
		const parts = [`${n.name} · +${n.deltaDurationPercent} %`, n.compensation];
		if (n.needsRoomAlone) parts.push('Einzelraum');
		if (n.needsHardware) parts.push('Hardware');
		return parts.join(' · ');
	}

	/** @param {any} day */
	function dayRoomCount(day) {
		let n = 0;
		for (const s of day.slots)
			for (const r of s.slot?.roomsWithInvigilators ?? []) if (r.name !== 'No Room') n++;
		return n;
	}

	/** @param {any} day */
	function dayOpenCount(day) {
		let n = 0;
		for (const s of day.slots)
			for (const r of s.slot?.roomsWithInvigilators ?? [])
				if (r.name !== 'No Room' && !r.invigilator) n++;
		return n;
	}

	// von der Anforderungen-Seite verlinkt: ?focus=<id> hebt diese Aufsicht direkt hervor
	if (data.focus) {
		const fid = Number(data.focus);
		selectPerson(fid, teacherName.get(fid) ?? String(fid));
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Aufsichtsplan</h1>
		{#if selKind}
			<span class="badge badge-primary badge-lg gap-2">
				{selectedName}{selKind === 'teacher' ? ` (${selectedId})` : ' · NTA'}
				<button class="font-bold" on:click={clearSel}>✕</button>
			</span>
		{/if}
		<div class="ml-auto flex gap-1">
			<button class="btn btn-ghost btn-xs" on:click={() => setAll(true)}>alle ausklappen</button>
			<button class="btn btn-ghost btn-xs" on:click={() => setAll(false)}>alle einklappen</button>
		</div>
	</div>

	<!-- Auswahl per Dropdown -->
	<div class="flex flex-wrap items-center gap-2">
		<select
			class="select select-bordered select-sm"
			bind:value={examinerSel}
			on:change={() => examinerSel && selectPerson(examinerSel, examinerMap.get(examinerSel) ?? '')}
		>
			<option value={0}>Prüfende wählen…</option>
			{#each examiners as ex}
				<option value={ex.id}>{ex.name}</option>
			{/each}
		</select>
		<select
			class="select select-bordered select-sm"
			bind:value={ntaSel}
			on:change={() => ntaSel && selectNta(ntaSel)}
		>
			<option value="">NTA wählen…</option>
			{#each ntaList as n}
				<option value={n.mtknr}>{n.name} (+{n.deltaDurationPercent} %)</option>
			{/each}
		</select>
	</div>

	<!-- Legende -->
	<div class="flex flex-wrap items-center gap-2 text-xs">
		<span class="rounded bg-warning px-1.5 py-0.5 font-medium text-warning-content"
			>👤 Aufsicht</span
		>
		<span class="font-semibold text-info">Prüfende</span>
		<span class="badge badge-neutral badge-sm">👥 Personen</span>
		<span class="badge badge-accent badge-sm">⏱ Dauer</span>
		<span class="badge badge-secondary badge-sm">NTA (Details im Hover)</span>
		<span class="rounded bg-error px-1.5 py-0.5 font-medium text-error-content">fehlt</span>
	</div>

	<div class="flex flex-col gap-5">
		{#each days as day, i}
			<details
				bind:open={open[i]}
				class="overflow-hidden rounded-box border-2 border-base-300 bg-base-100 shadow-md"
			>
				<summary
					class="flex cursor-pointer list-none items-center gap-3 border-l-8 border-primary bg-base-200 px-4 py-3 text-base-content"
				>
					<span class="text-lg font-bold">Tag {day.number}</span>
					<span class="text-sm text-base-content/70">{mkDateShort(day.date)}</span>
					<span class="ml-auto flex items-center gap-2 text-xs text-base-content/70">
						{dayRoomCount(day)} Räume
						{#if dayOpenCount(day) > 0}
							<span class="badge badge-error badge-sm">{dayOpenCount(day)} ohne Aufsicht</span>
						{/if}
					</span>
				</summary>

				<div class="flex flex-col gap-3 p-3">
					{#each day.slots as s}
						{@const slot = s.slot}
						{@const slotHi =
							selKind === 'teacher' && !!slot && !!slot.reserve && slot.reserve.id === selectedId}
						<div
							class="rounded-lg border p-2 {slotHi
								? 'border-primary ring-2 ring-primary'
								: 'border-base-300 bg-base-200/40'}"
						>
							<div
								class="mb-2 flex flex-wrap items-center gap-2 text-sm {slotHi
									? 'rounded bg-primary px-2 py-1 text-primary-content'
									: 'border-b border-base-300 pb-1.5'}"
							>
								<span class="badge {slotHi ? 'badge-neutral' : 'badge-primary'}"
									>Slot {s.time.number}</span
								>
								<span class="font-semibold">{s.time.start} Uhr</span>
								{#if slot}
									{#if slot.reserve}
										<button
											class="rounded bg-warning px-2 py-0.5 text-xs font-semibold text-warning-content hover:brightness-95 {slot
												.reserve.id === selectedId
												? 'ring-2 ring-primary ring-offset-1'
												: ''}"
											style:opacity={selKind && slot.reserve.id !== selectedId ? 0.4 : 1}
											on:click={() => selectPerson(slot.reserve.id, slot.reserve.shortname)}
										>
											Reserve: {slot.reserve.shortname}
										</button>
									{:else}
										<span
											class="rounded bg-error px-2 py-0.5 text-xs font-semibold text-error-content"
											>keine Reserve</span
										>
									{/if}
								{/if}
							</div>

							{#if slot && slot.roomsWithInvigilators && slot.roomsWithInvigilators.length}
								<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{#each slot.roomsWithInvigilators as r}
										{@const involved = roomInvolved(r, selKind, selectedId, selectedNta)}
										<div
											class="overflow-hidden rounded-lg border border-base-300 text-xs shadow-sm {selKind ===
												'teacher' &&
											involved &&
											!slotHi
												? 'border-primary ring-4 ring-primary'
												: ''}"
											style:opacity={roomOpacity(r, selKind, selectedId, selectedNta, slotHi)}
										>
											<!-- Kopf: Raum + Personen + Dauer -->
											<div
												class="flex items-center gap-1.5 px-2 py-1 {selKind === 'teacher' &&
												involved
													? 'bg-primary text-primary-content'
													: 'bg-base-300'}"
											>
												<span class="font-bold">{r.name}</span>
												<span class="badge badge-neutral badge-sm ml-auto">👥 {r.studentCount}</span
												>
												<span class="badge badge-accent badge-sm">⏱ {r.maxDuration}′</span>
											</div>

											<div class="space-y-1.5 p-2">
												<!-- Aufsicht -->
												{#if r.invigilator}
													<button
														class="flex w-full items-center gap-1 rounded bg-warning px-1.5 py-1 text-left font-semibold text-warning-content hover:brightness-95 {r
															.invigilator.id === selectedId
															? 'ring-2 ring-primary ring-offset-1'
															: ''}"
														style:opacity={selKind && r.invigilator.id !== selectedId ? 0.4 : 1}
														on:click={() => selectPerson(r.invigilator.id, r.invigilator.shortname)}
													>
														👤 {r.invigilator.shortname}
													</button>
												{:else if r.name !== 'No Room'}
													<div
														class="rounded bg-error px-1.5 py-1 font-semibold text-error-content"
													>
														⚠ keine Aufsicht
													</div>
												{/if}

												<!-- Prüfungen -->
												<ul class="space-y-1">
													{#each r.roomAndExams as re}
														{@const ntas = ntaIn(re)}
														{@const ntaHere =
															selKind === 'nta' &&
															(re.room.studentsInRoom ?? []).includes(selectedNta)}
														{@const liActive =
															ntaHere ||
															(selKind === 'teacher' && re.exam.mainExamerID === selectedId)}
														<li
															class="rounded border-l-4 px-1.5 py-1 {ntaHere
																? 'border-primary bg-primary text-primary-content'
																: 'border-info/60 bg-base-200'}"
															style:opacity={selKind && !liActive ? 0.4 : 1}
														>
															<div class="flex items-start justify-between gap-1">
																<span class="min-w-0">
																	<span class="tabular-nums opacity-50">{re.exam.ancode}</span>
																	<button
																		class="font-semibold hover:underline {re.exam.mainExamerID ===
																		selectedId
																			? 'rounded bg-primary px-1 text-primary-content'
																			: ntaHere
																				? 'text-primary-content'
																				: 'text-info'}"
																		on:click={() =>
																			selectPerson(re.exam.mainExamerID, re.exam.mainExamer)}
																	>
																		{re.exam.mainExamer}
																	</button>
																	<span class="opacity-80">· {re.exam.module}</span>
																</span>
																<span class="badge badge-neutral badge-xs shrink-0"
																	>👥 {re.room.studentsInRoom.length}</span
																>
															</div>

															{#if ntas.length}
																<div class="mt-1 flex flex-wrap items-center gap-1">
																	{#each ntas as n}
																		<span
																			class="badge badge-secondary badge-sm cursor-help {selKind ===
																				'nta' && n.mtknr === selectedNta
																				? 'ring-2 ring-primary ring-offset-1'
																				: ''}"
																			title={ntaTitle(n)}
																		>
																			NTA +{n.deltaDurationPercent}%{n.needsRoomAlone
																				? ' 🚪'
																				: ''}{n.needsHardware ? ' 🖥' : ''}
																		</span>
																	{/each}
																</div>
															{/if}
														</li>
													{/each}
												</ul>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-xs text-base-content/50">keine Räume geplant</div>
							{/if}
						</div>
					{/each}
				</div>
			</details>
		{/each}
	</div>
</div>
