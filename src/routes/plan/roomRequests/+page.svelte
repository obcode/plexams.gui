<script>
	import { invalidateAll } from '$app/navigation';
	import { slide, fade } from 'svelte/transition';
	import RoomRequestToggles from '$lib/room/RoomRequestToggles.svelte';
	import RoomRequestPlanned from '$lib/room/RoomRequestPlanned.svelte';
	import EmailSender from '$lib/email/EmailSender.svelte';

	export let data;

	/** @type {'preview' | 'manage' | 'email'} */
	let section = 'manage';

	/** @param {any} r */
	const key = (r) => `${r.room}-${r.day}-${r.slot}`;

	// from/until sind ISO-Zeitstempel mit Offset (z. B. ...T10:15:00+02:00).
	// Direkt aus dem String formatieren (kein new Date) → keine Zeitzonen-Probleme.
	/** @param {string} iso */
	const fmtDate = (iso) => {
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
		return m ? `${m[3]}.${m[2]}.${m[1]}` : (iso ?? '');
	};
	/** @param {string} iso */
	const fmtTime = (iso) => {
		const m = /T(\d{2}):(\d{2})/.exec(iso ?? '');
		return m ? `${m[1]}:${m[2]}` : '';
	};
	/** Zeit (HH:MM) im ISO-String ersetzen, Datum + Offset behalten.
	 * @param {string} iso @param {string} hhmm */
	const isoReplaceTime = (iso, hhmm) => {
		const m = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2})?(.*)$/.exec(iso ?? '');
		return m ? `${m[1]}T${hhmm}:00${m[2]}` : iso;
	};

	// ===== Abschnitt: Bestehende Anfragen =====
	/** @type {'time' | 'room' | 'slot'} */
	let view = 'room';
	let pendingOnly = false;

	$: filtered = data.roomRequests.filter((/** @type {any} */ r) => !pendingOnly || !r.approved);
	$: approvedCount = data.roomRequests.filter((/** @type {any} */ r) => r.approved).length;
	$: pendingCount = data.roomRequests.length - approvedCount;

	$: byRoom = [...new Set(filtered.map((/** @type {any} */ r) => r.room))].sort().map((room) => ({
		room,
		reqs: filtered
			.filter((/** @type {any} */ r) => r.room === room)
			.sort((/** @type {any} */ a, /** @type {any} */ b) => a.from.localeCompare(b.from))
	}));
	$: bySlot = (() => {
		/** @type {Map<string, any>} */
		const m = new Map();
		for (const r of filtered) {
			const k = `${r.day}-${r.slot}`;
			if (!m.has(k)) m.set(k, { day: r.day, slot: r.slot, reqs: [] });
			m.get(k).reqs.push(r);
		}
		return [...m.values()].sort((a, b) => a.day - b.day || a.slot - b.slot);
	})();
	$: timeline = [...filtered].sort((/** @type {any} */ a, /** @type {any} */ b) =>
		a.from.localeCompare(b.from)
	);

	// Tag → Datum/Offset (für „Anfrage hinzufügen")
	$: dayInfo = (() => {
		/** @type {Record<number, { date: string, offset: string }>} */
		const m = {};
		for (const r of data.roomRequests) {
			const mm = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2})?(.*)$/.exec(r.from);
			if (mm && !(r.day in m)) m[r.day] = { date: mm[1], offset: mm[2] || '+02:00' };
		}
		return m;
	})();
	$: knownDays = Object.keys(dayInfo)
		.map(Number)
		.sort((a, b) => a - b);

	/** @type {Set<string>} */
	let busyKeys = new Set();
	/** @type {string | null} */
	let errorMsg = null;

	/** @param {'approve' | 'active'} kind @param {any} req */
	async function toggle(kind, req) {
		const k = key(req);
		busyKeys = new Set(busyKeys).add(k);
		errorMsg = null;
		try {
			const url = kind === 'approve' ? '/api/setRoomRequestApproved' : '/api/setRoomRequestActive';
			const body =
				kind === 'approve'
					? { room: req.room, day: req.day, slot: req.slot, approved: !req.approved }
					: { room: req.room, day: req.day, slot: req.slot, active: !req.active };
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				errorMsg = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			const s = new Set(busyKeys);
			s.delete(k);
			busyKeys = s;
		}
	}

	const VIEWS = [
		{ key: 'room', label: 'nach Raum' },
		{ key: 'slot', label: 'nach Slot' },
		{ key: 'time', label: 'zeitlich' }
	];

	// ===== Zeit-Modal (bearbeiten + hinzufügen) =====
	let modalOpen = false;
	/** @type {'edit' | 'add'} */
	let modalMode = 'edit';
	/** @type {any} */
	let mEditReq = null;
	let mRoom = '';
	let mDay = '';
	let mSlot = '';
	let mFromTime = '';
	let mUntilTime = '';
	let mSaving = false;
	/** @type {string | null} */
	let mError = null;

	/** @param {any} r */
	function openEdit(r) {
		modalMode = 'edit';
		mEditReq = r;
		mRoom = r.room;
		mDay = String(r.day);
		mSlot = String(r.slot);
		mFromTime = fmtTime(r.from);
		mUntilTime = fmtTime(r.until);
		mError = null;
		modalOpen = true;
	}
	function openAdd() {
		modalMode = 'add';
		mEditReq = null;
		mRoom = '';
		mDay = knownDays.length ? String(knownDays[0]) : '';
		mSlot = '';
		mFromTime = '';
		mUntilTime = '';
		mError = null;
		modalOpen = true;
	}
	$: modalValid =
		mFromTime && mUntilTime && (modalMode === 'edit' || (mRoom.trim() && mDay && mSlot));

	async function saveModal() {
		if (!modalValid) return;
		mSaving = true;
		mError = null;
		let from, until;
		if (modalMode === 'edit') {
			from = isoReplaceTime(mEditReq.from, mFromTime);
			until = isoReplaceTime(mEditReq.until, mUntilTime);
		} else {
			const info = dayInfo[Number(mDay)];
			if (!info) {
				mError = 'Für diesen Tag ist kein Datum bekannt.';
				mSaving = false;
				return;
			}
			from = `${info.date}T${mFromTime}:00${info.offset}`;
			until = `${info.date}T${mUntilTime}:00${info.offset}`;
		}
		const url = modalMode === 'edit' ? '/api/updateRoomRequestTime' : '/api/addRoomRequest';
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ room: mRoom, day: Number(mDay), slot: Number(mSlot), from, until })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				mError = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			modalOpen = false;
			await invalidateAll();
		} catch (e) {
			mError = e instanceof Error ? e.message : String(e);
		} finally {
			mSaving = false;
		}
	}

	// ===== Abschnitt: Probelauf =====
	/** @type {any[] | null} */
	let preview = null;
	let previewLoading = false;
	/** @type {string | null} */
	let previewError = null;
	/** @type {Set<number>} */
	let expanded = new Set();
	let applying = false;
	/** @type {string | null} */
	let applyError = null;
	/** @type {string | null} */
	let applyMsg = null;

	async function loadPreview() {
		previewLoading = true;
		previewError = null;
		applyMsg = null;
		try {
			const res = await fetch('/api/roomRequestsPreview');
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				previewError = result?.error ?? `Fehler (HTTP ${res.status})`;
				preview = null;
				return;
			}
			preview = result.roomRequestsPreview ?? [];
			expanded = new Set();
		} catch (e) {
			previewError = e instanceof Error ? e.message : String(e);
		} finally {
			previewLoading = false;
		}
	}
	/** @param {number} i */
	function toggleExpand(i) {
		const s = new Set(expanded);
		if (s.has(i)) s.delete(i);
		else s.add(i);
		expanded = s;
	}

	/** @param {boolean} force */
	async function applyPreview(force) {
		applying = true;
		applyError = null;
		applyMsg = null;
		try {
			const res = await fetch('/api/applyRoomRequestsPreview', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ force })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				const err = result?.error ?? `Fehler (HTTP ${res.status})`;
				if (!force && /already exist/i.test(err)) {
					if (confirm('Es existieren bereits Anfragen. Bestehende verwerfen und neu generieren?')) {
						applying = false;
						return applyPreview(true);
					}
					return;
				}
				applyError = err;
				return;
			}
			applyMsg = `${result.applyRoomRequestsPreview} Anfragen übernommen.`;
			await invalidateAll();
			section = 'manage';
		} catch (e) {
			applyError = e instanceof Error ? e.message : String(e);
		} finally {
			applying = false;
		}
	}

	const SECTIONS = [
		{ key: 'preview', label: 'Probelauf' },
		{ key: 'manage', label: 'Bestehende Anfragen' },
		{ key: 'email', label: 'E-Mail senden' }
	];
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Raum-Anfragen (Gebäudemanagement)</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.roomRequests.length}</span>
		<span class="text-sm text-base-content/60">{approvedCount} genehmigt · {pendingCount} offen</span>
		<div class="flex-1"></div>
		<div role="tablist" class="tabs tabs-boxed">
			{#each SECTIONS as s}
				<button
					role="tab"
					class="tab {section === s.key ? 'tab-active' : ''}"
					on:click={() => (section = /** @type {any} */ (s.key))}
				>
					{s.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- ===================== Probelauf ===================== -->
	{#if section === 'preview'}
		<p class="text-xs text-base-content/50">
			Read-only: zeigt, welche Management-Räume für welche Prüfungen angefragt würden. „Übernehmen"
			schreibt den Probelauf in die DB und ersetzt bestehende Anfragen.
		</p>
		<div class="flex flex-wrap items-center gap-3">
			<button class="btn btn-sm gap-2" disabled={previewLoading} on:click={loadPreview}>
				{#if previewLoading}<span class="loading loading-spinner loading-xs"></span>{/if}
				↻ Vorschau {preview ? 'neu laden' : 'laden'}
			</button>
			{#if preview}
				<span class="text-sm text-base-content/60">{preview.length} Raum-Slots</span>
				<div class="flex-1"></div>
				<button class="btn btn-primary btn-sm" disabled={applying} on:click={() => applyPreview(false)}>
					{#if applying}<span class="loading loading-spinner loading-xs"></span>{/if}
					Übernehmen
				</button>
			{/if}
		</div>

		{#if previewError}
			<div class="alert alert-error py-2 text-sm" transition:fade><span>{previewError}</span></div>
		{/if}
		{#if applyError}
			<div class="alert alert-error py-2 text-sm" transition:fade><span>{applyError}</span></div>
		{/if}
		{#if applyMsg}
			<div class="alert alert-success py-2 text-sm" transition:fade><span>{applyMsg}</span></div>
		{/if}

		{#if preview}
			{#if !preview.length}
				<div class="text-base-content/50">Keine Anfragen im Probelauf.</div>
			{:else}
				<div class="overflow-x-auto rounded-lg border border-base-300">
					<table class="table table-zebra table-sm">
						<thead>
							<tr>
								<th></th>
								<th>Raum</th>
								<th>Datum</th>
								<th>Zeit</th>
								<th class="text-right">Plätze</th>
								<th>Prüfung</th>
							</tr>
						</thead>
						<tbody>
							{#each preview as p, i}
								<tr>
									<td>
										{#if p.simultaneousExams && p.simultaneousExams.length}
											<button
												class="btn btn-ghost btn-xs"
												on:click={() => toggleExpand(i)}
												aria-label="zeitgleiche Prüfungen"
											>
												{expanded.has(i) ? '▾' : '▸'}
											</button>
										{/if}
									</td>
									<td class="font-medium">{p.room}</td>
									<td class="whitespace-nowrap">{fmtDate(p.from)}</td>
									<td class="whitespace-nowrap tabular-nums">{fmtTime(p.from)}–{fmtTime(p.until)}</td>
									<td
										class="text-right tabular-nums {p.students > p.seats
											? 'font-semibold text-error'
											: ''}"
									>
										{p.students} / {p.seats}
									</td>
									<td>
										{#if p.exam}
											<span class="font-medium tabular-nums">{p.exam.ancode}</span>
											{p.exam.zpaExam.module}
											<span class="text-base-content/50">· {p.exam.zpaExam.mainExamer}</span>
											{#if p.exam.ntas && p.exam.ntas.length}
												<span class="badge badge-warning badge-sm ml-1">{p.exam.ntas.length} NTA</span>
											{/if}
										{/if}
									</td>
								</tr>
								{#if expanded.has(i) && p.simultaneousExams && p.simultaneousExams.length}
									<tr>
										<td></td>
										<td colspan="5" class="bg-base-200/40">
											<div class="py-1 text-xs text-base-content/60">
												Zeitgleiche Prüfungen im Slot:
											</div>
											<div class="flex flex-col gap-1 pb-2">
												{#each p.simultaneousExams as se}
													<div class="text-sm">
														<span class="font-medium tabular-nums">{se.ancode}</span>
														{se.zpaExam.module}
														<span class="text-base-content/50">
															· {se.zpaExam.mainExamer} · {se.studentRegsCount} Anm.
														</span>
													</div>
												{/each}
											</div>
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{:else if !previewLoading}
			<div class="text-base-content/50">Noch keine Vorschau geladen.</div>
		{/if}

		<!-- ===================== Bestehende Anfragen ===================== -->
	{:else if section === 'manage'}
		<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
			<div role="tablist" class="tabs tabs-boxed">
				{#each VIEWS as v}
					<button
						role="tab"
						class="tab {view === v.key ? 'tab-active' : ''}"
						on:click={() => (view = /** @type {any} */ (v.key))}
					>
						{v.label}
					</button>
				{/each}
			</div>
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" class="checkbox checkbox-sm" bind:checked={pendingOnly} />
				<span class="label-text">nur offene</span>
			</label>
			<div class="flex-1"></div>
			<button class="btn btn-primary btn-sm gap-2" on:click={openAdd}>+ Anfrage hinzufügen</button>
		</div>
		<p class="text-xs text-base-content/50">
			„inaktiv" wird beim nächsten Vorbereiten der Räume-für-Slots nicht verwendet.
		</p>

		{#if errorMsg}
			<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
		{/if}

		{#if !filtered.length}
			<div class="text-base-content/50">Keine Anforderungen.</div>
		{:else if view === 'time'}
			<div class="overflow-x-auto rounded-lg border border-base-300">
				<table class="table table-zebra table-sm">
					<thead>
						<tr>
							<th>Datum</th>
							<th>Zeit</th>
							<th>Raum</th>
							<th>Tag/Slot</th>
							<th>Belegung</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each timeline as r (key(r))}
							<tr class={r.active ? '' : 'opacity-50'}>
								<td>{fmtDate(r.from)}</td>
								<td class="tabular-nums">{fmtTime(r.from)}–{fmtTime(r.until)}</td>
								<td class="font-medium">{r.room}</td>
								<td class="text-base-content/60">Tag {r.day} · Slot {r.slot}</td>
								<td><RoomRequestPlanned planned={r.planned} /></td>
								<td>
									<RoomRequestToggles
										req={r}
										busy={busyKeys.has(key(r))}
										on:approve={() => toggle('approve', r)}
										on:active={() => toggle('active', r)}
										on:edittime={() => openEdit(r)}
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if view === 'room'}
			<div class="flex flex-col gap-3">
				{#each byRoom as group (group.room)}
					<div class="rounded-lg border border-base-300 bg-base-100 p-3">
						<div class="mb-2 flex items-center gap-2">
							<span class="font-semibold">{group.room}</span>
							<span class="badge badge-ghost badge-sm tabular-nums">{group.reqs.length}</span>
						</div>
						<div class="overflow-x-auto">
							<table class="table table-sm">
								<tbody>
									{#each group.reqs as r (key(r))}
										<tr class={r.active ? '' : 'opacity-50'}>
											<td class="whitespace-nowrap">{fmtDate(r.from)}</td>
											<td class="whitespace-nowrap tabular-nums">{fmtTime(r.from)}–{fmtTime(r.until)}</td
											>
											<td class="whitespace-nowrap text-base-content/60">Tag {r.day} · Slot {r.slot}</td>
											<td><RoomRequestPlanned planned={r.planned} /></td>
											<td>
												<RoomRequestToggles
													req={r}
													busy={busyKeys.has(key(r))}
													on:approve={() => toggle('approve', r)}
													on:active={() => toggle('active', r)}
													on:edittime={() => openEdit(r)}
												/>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each bySlot as group (group.day + '-' + group.slot)}
					<div class="rounded-lg border border-base-300 bg-base-100 p-3">
						<div class="mb-2 flex items-center gap-2">
							<span class="font-semibold">Tag {group.day} · Slot {group.slot}</span>
							<span class="badge badge-ghost badge-sm tabular-nums">{group.reqs.length}</span>
							<span class="text-xs text-base-content/50">{fmtDate(group.reqs[0].from)}</span>
						</div>
						<div class="overflow-x-auto">
							<table class="table table-sm">
								<tbody>
									{#each group.reqs as r (key(r))}
										<tr class={r.active ? '' : 'opacity-50'}>
											<td class="whitespace-nowrap font-medium">{r.room}</td>
											<td class="whitespace-nowrap tabular-nums">{fmtTime(r.from)}–{fmtTime(r.until)}</td
											>
											<td><RoomRequestPlanned planned={r.planned} /></td>
											<td>
												<RoomRequestToggles
													req={r}
													busy={busyKeys.has(key(r))}
													on:approve={() => toggle('approve', r)}
													on:active={() => toggle('active', r)}
													on:edittime={() => openEdit(r)}
												/>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- ===================== E-Mail ===================== -->
	{:else}
		<EmailSender
			emailKey="sendEmailRoomRequests"
			title="Anfrage ans Gebäudemanagement senden"
			description="Verschickt alle aktiven Anforderungen (nach Raum gruppiert). Probelauf geht an die Testadresse."
		/>
	{/if}
</div>

<!-- Zeit-Modal -->
{#if modalOpen}
	<div class="modal modal-open" transition:fade>
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-semibold">
				{modalMode === 'edit' ? 'Zeit bearbeiten' : 'Anfrage hinzufügen'}
			</h3>
			<div class="flex flex-col gap-3">
				<div class="grid grid-cols-3 gap-3">
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Raum</span>
						<input
							type="text"
							class="input input-bordered input-sm"
							bind:value={mRoom}
							readonly={modalMode === 'edit'}
							class:input-disabled={modalMode === 'edit'}
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Tag</span>
						{#if modalMode === 'edit'}
							<input type="text" class="input input-disabled input-sm" value={mDay} readonly />
						{:else}
							<select class="select select-bordered select-sm" bind:value={mDay}>
								{#each knownDays as d}
									<option value={String(d)}>{d} ({dayInfo[d].date})</option>
								{/each}
							</select>
						{/if}
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Slot</span>
						<input
							type="number"
							min="1"
							class="input input-bordered input-sm"
							bind:value={mSlot}
							readonly={modalMode === 'edit'}
							class:input-disabled={modalMode === 'edit'}
						/>
					</label>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">von</span>
						<input type="time" class="input input-bordered input-sm" bind:value={mFromTime} />
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">bis</span>
						<input type="time" class="input input-bordered input-sm" bind:value={mUntilTime} />
					</label>
				</div>
				<p class="text-xs text-base-content/50">
					Zeiten enthalten üblicherweise ±15 Min Puffer; Datum/Zeitzone bleiben erhalten.
				</p>

				{#if mError}
					<div class="alert alert-error py-2 text-sm"><span>{mError}</span></div>
				{/if}

				<div class="flex justify-end gap-2">
					<button class="btn btn-ghost btn-sm" on:click={() => (modalOpen = false)} disabled={mSaving}>
						Abbrechen
					</button>
					<button
						class="btn btn-primary btn-sm gap-2"
						on:click={saveModal}
						disabled={mSaving || !modalValid}
					>
						{#if mSaving}<span class="loading loading-spinner loading-xs"></span>{/if}
						{modalMode === 'edit' ? 'Speichern' : 'Hinzufügen'}
					</button>
				</div>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="Schließen" on:click={() => (modalOpen = false)}
		></button>
	</div>
{/if}
