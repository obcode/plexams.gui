<script>
	import { invalidateAll } from '$app/navigation';

	export let data;

	/** @param {string} t */
	const fmtTime = (t) => /(\d{2}:\d{2})/.exec(t ?? '')?.[1] ?? '';
	/** @param {any} s */
	const slotLabel = (s) => {
		const t = fmtTime(s.starttime);
		return `Tag ${s.dayNumber} · Slot ${s.slotNumber}${t ? ` (${t})` : ''}`;
	};
	/** @param {any} e */
	const slotValue = (e) =>
		e.plannedDayNumber != null && e.plannedSlotNumber != null
			? `${e.plannedDayNumber}-${e.plannedSlotNumber}`
			: '';

	let listError = '';
	/** @type {Set<number>} */
	let busy = new Set();

	// ---- Editor ----
	/** @type {any} */
	let editing = null;
	let isNew = false;
	let editError = '';
	let saving = false;

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
	}
	const closeEdit = () => (editing = null);

	/** @param {string} sn */
	function toggleProgram(sn) {
		editing.programs = editing.programs.includes(sn)
			? editing.programs.filter((/** @type {string} */ x) => x !== sn)
			: [...editing.programs, sn];
	}

	async function save() {
		if (!Number(editing.examerID)) {
			editError = 'Prüfer/in wählen.';
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

	// ZPA-Ancode-Zuordnung
	/** @type {any} */
	let suggestFor = null;
	/** @type {any[]} */
	let suggestions = [];
	let suggestLoading = false;
	let suggestError = '';
	let manualAncode = '';
	let connecting = false;

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

	// Zuordnung generieren & validieren
	/** @type {{ok:boolean, assignedCount:number, unassignedIDs:number[], messages:string[]}|null} */
	let validation = null;
	let validationKind = '';
	let validating = false;
	let generating = false;
	let keepAssigned = true;

	$: unassignedSet = new Set(validation?.unassignedIDs ?? []);

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
				keepAssigned
					? 'Zuordnung generieren? Manuell gesetzte Slots bleiben fix, nur unzugeordnete werden platziert.'
					: 'Zuordnung komplett neu generieren? Bestehende Slot-Zuordnungen werden überschrieben.'
			)
		)
			return;
		generating = true;
		listError = '';
		try {
			const res = await fetch('/api/generatePreplanAssignment', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ keepAssigned })
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
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">SEB/EXaHM-Vorplanung</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.exams.length}</span>
		<div class="flex-1"></div>
		<label
			class="flex cursor-pointer items-center gap-1 text-sm"
			title="Manuell gesetzte Slots fix lassen, nur unzugeordnete platzieren"
		>
			<input type="checkbox" class="checkbox checkbox-xs" bind:checked={keepAssigned} />
			<span>gesetzte behalten</span>
		</label>
		<button class="btn btn-outline btn-sm" on:click={validate} disabled={validating || generating}>
			{validating ? 'validiert …' : 'Validieren'}
		</button>
		<button
			class="btn btn-secondary btn-sm"
			on:click={generate}
			disabled={validating || generating}
		>
			{generating ? 'generiert …' : 'Zuordnung generieren'}
		</button>
		<button class="btn btn-primary btn-sm" on:click={openAdd}>+ Prüfung</button>
	</div>

	<div class="alert alert-info flex-col items-start py-2 text-sm">
		<span>
			Diese Vorplanung liegt in der DB des <strong>betreffenden Semesters</strong> — plexams muss auf
			dieses Semester gestartet sein.
		</span>
		<span class="text-xs opacity-80">
			Ablauf: Pre-Exams erfassen → <strong>Zuordnung generieren</strong> →
			<strong>Validieren</strong> → fehlende Räume in Anny buchen → Anny-Buchungen importieren → erneut
			validieren, bis alles ok.
		</span>
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
					<span class="badge badge-error badge-sm">
						{validation.unassignedIDs.length} nicht zugeordnet
					</span>
				{:else}
					<span class="badge badge-success badge-sm">vollständig</span>
				{/if}
				<div class="flex-1"></div>
				<button class="btn btn-ghost btn-xs" on:click={() => (validation = null)}>schließen</button>
			</div>
			{#if validation.messages.length}
				<ul class="mt-1 list-inside list-disc text-sm">
					{#each validation.messages as m}
						<li>{m}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	<!-- Vorplanungs-Übersicht: Raumbedarf + Überschneidungen je Slot -->
	{#if data.overview.length}
		<div class="flex flex-col gap-2">
			<h2 class="text-lg font-semibold">Übersicht — Raumbedarf & Überschneidungen</h2>
			<div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
				{#each data.overview as slot}
					{@const isBucket = slot.dayNumber == null}
					<div
						class="flex flex-col gap-2 rounded-lg border p-3 {isBucket
							? 'border-warning bg-warning/10'
							: 'border-base-300 bg-base-100'}"
					>
						<div class="font-medium">
							{#if isBucket}
								⚠ Ohne Slot — noch zuzuordnen
							{:else}
								Tag {slot.dayNumber} · Slot {slot.slotNumber}{slot.starttime
									? ` (${fmtTime(slot.starttime)})`
									: ''}
							{/if}
						</div>

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{#each [{ label: 'EXaHM', color: 'badge-info', need: slot.exahm }, { label: 'SEB', color: 'badge-error', need: slot.seb }] as k}
								{#if k.need.examCount > 0}
									<div class="rounded border border-base-300 p-2 text-sm">
										<div class="flex items-center gap-2">
											<span class="badge {k.color} badge-sm">{k.label}</span>
											<span class="tabular-nums">{k.need.examCount} Prüfung(en)</span>
										</div>
										<div
											class="mt-1 tabular-nums {k.need.seatsNeeded > k.need.seatsAvailable
												? 'font-medium text-error'
												: 'text-base-content/70'}"
										>
											{k.need.seatsNeeded} Plätze nötig · {k.need.seatsAvailable} verfügbar
											{#if k.need.seatsNeeded > k.need.seatsAvailable}
												<span class="text-error">⚠ Kapazität reicht nicht</span>
											{/if}
										</div>
										<div
											class="mt-1 flex flex-wrap items-center gap-x-2 tabular-nums {k.need
												.seatsBooked < k.need.seatsNeeded
												? 'font-medium text-warning'
												: 'text-base-content/70'}"
										>
											<span>nötig {k.need.seatsNeeded}</span>
											<span>· gebucht {k.need.seatsBooked}</span>
											{#if k.need.seatsBooked < k.need.seatsNeeded}
												<span class="badge badge-warning badge-sm">
													noch zu buchen: {k.need.seatsNeeded - k.need.seatsBooked} Plätze
												</span>
											{:else}
												<span class="badge badge-success badge-sm">gebucht</span>
											{/if}
										</div>
										{#if k.need.roomsToBook.length}
											<div class="mt-1 text-xs text-warning">
												noch in Anny buchen: <span class="font-medium"
													>{k.need.roomsToBook.join(', ')}</span
												>
											</div>
										{/if}
										{#if k.need.rooms.length}
											<div class="mt-1 text-xs text-base-content/60">
												Vorschlag ({k.need.roomsSuggested}): {k.need.rooms.join(', ')}
											</div>
										{/if}
									</div>
								{/if}
							{/each}
						</div>

						{#if slot.conflicts.length}
							<div class="flex flex-col gap-1">
								{#each slot.conflicts as c}
									<div class="alert alert-warning py-1 text-xs">
										<span>
											Studiengang <strong>{c.program}</strong> mehrfach im Slot:
											{c.modules.join(', ')}
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if data.exams.length === 0}
		<div class="text-sm text-base-content/50">Noch keine SEB/EXaHM-Vorplanungen angelegt.</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Art</th>
						<th>Modul</th>
						<th>Prüfer/in</th>
						<th>Studiengänge</th>
						<th>Studis</th>
						<th>Dauer</th>
						<th>Slot</th>
						<th>ZPA / Ancode</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.exams as e (e.id)}
						<tr
							class="hover {unassignedSet.has(e.id)
								? 'bg-error/10'
								: data.zpaPresent && !e.ancode
									? 'bg-warning/5'
									: ''}"
						>
							<td>
								{#if unassignedSet.has(e.id)}
									<span class="mr-1" title="konnte nicht zugeordnet werden">⚠</span>
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
							</td>
							<td class="text-sm">{e.examerName}</td>
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
									<select
										class="select select-bordered select-xs"
										value={slotValue(e)}
										disabled={busy.has(e.id)}
										on:change={(ev) => setSlot(e, ev.currentTarget.value)}
									>
										<option value="">— nicht zugeordnet</option>
										{#each data.slots as s}
											<option value="{s.dayNumber}-{s.slotNumber}">{slotLabel(s)}</option>
										{/each}
									</select>
								</div>
							</td>
							<td>
								{#if e.ancode}
									<span class="badge badge-success badge-sm tabular-nums">✓ {e.ancode}</span>
									<button class="btn btn-ghost btn-xs" on:click={() => disconnect(e)}>Lösen</button>
								{:else}
									<span class="badge badge-sm {data.zpaPresent ? 'badge-warning' : 'badge-ghost'}">
										nicht zugeordnet
									</span>
									<button class="btn btn-ghost btn-xs" on:click={() => openSuggest(e)}
										>Zuordnen</button
									>
								{/if}
							</td>
							<td class="text-right whitespace-nowrap">
								<button class="btn btn-ghost btn-xs" on:click={() => openEdit(e)}>Bearbeiten</button
								>
								<button class="btn btn-ghost btn-xs text-error" on:click={() => del(e)}
									>Löschen</button
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
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Art</span>
					<select class="select select-bordered select-sm w-32" bind:value={editing.examKind}>
						<option value="EXaHM">EXaHM</option>
						<option value="SEB">SEB</option>
					</select>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Prüfer/in</span>
					<select class="select select-bordered select-sm" bind:value={editing.examerID}>
						<option value={0}>— wählen</option>
						{#each data.teachers as t}
							<option value={t.id}>{t.fullname}</option>
						{/each}
					</select>
				</label>
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
					class="flex max-h-40 flex-wrap gap-x-4 gap-y-1 overflow-y-auto rounded-lg border border-base-300 p-2"
				>
					{#each data.studyPrograms as sp}
						<label class="flex cursor-pointer items-center gap-1 text-sm">
							<input
								type="checkbox"
								class="checkbox checkbox-xs"
								checked={editing.programs.includes(sp.shortname)}
								on:change={() => toggleProgram(sp.shortname)}
							/>
							<span class="font-mono">{sp.shortname}</span>
							{#if sp.name}<span class="text-base-content/50">{sp.name}</span>{/if}
						</label>
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
				<button class="btn btn-ghost btn-sm" on:click={closeEdit} disabled={saving}
					>Abbrechen</button
				>
				<button class="btn btn-primary btn-sm" on:click={save} disabled={saving}>
					{saving ? 'speichert …' : 'Speichern'}
				</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={closeEdit}></button>
	</div>
{/if}

<!-- ZPA-Ancode zuordnen -->
{#if suggestFor}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h2 class="text-lg font-semibold">Ancode zuordnen</h2>
			<p class="mt-1 text-sm text-base-content/60">
				{suggestFor.examKind} · {suggestFor.module} · {suggestFor.examerName}
			</p>

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
									<th>Prüfer/in</th>
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
											<button
												class="btn btn-primary btn-xs"
												disabled={connecting}
												on:click={() => connect(s.ancode)}
											>
												verknüpfen
											</button>
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
					<button
						class="btn btn-outline btn-sm"
						disabled={connecting || !manualAncode}
						on:click={() => connect(manualAncode)}
					>
						verknüpfen
					</button>
				</div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" on:click={closeSuggest} disabled={connecting}>
					Schließen
				</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={closeSuggest}></button>
	</div>
{/if}
