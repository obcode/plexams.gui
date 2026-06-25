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
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">SEB/EXaHM-Vorplanung</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.exams.length}</span>
		<div class="flex-1"></div>
		<button class="btn btn-primary btn-sm" on:click={openAdd}>+ Prüfung</button>
	</div>

	<div class="alert alert-info py-2 text-sm">
		<span>
			Diese Vorplanung liegt in der DB des <strong>betreffenden Semesters</strong> — plexams muss auf
			dieses Semester gestartet sein.
		</span>
	</div>

	{#if listError}
		<div class="alert alert-error py-2 text-sm"><span>{listError}</span></div>
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
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.exams as e (e.id)}
						<tr class="hover">
							<td>
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
									{#if e.ancode}<span class="badge badge-outline badge-xs">ancode {e.ancode}</span
										>{/if}
								</div>
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
