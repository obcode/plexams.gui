<script>
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';

	export let data;

	$: teacherName = new Map(data.teachers.map((/** @type {any} */ t) => [t.id, t.fullname]));

	let listError = '';
	/** @type {any} */
	let editing = null;
	let isNew = false;
	let origAncode = 0;
	let editError = '';
	let saving = false;

	/** @param {string} ddmmyyyy → „yyyy-mm-dd" fürs date-Input */
	function toDateInput(ddmmyyyy) {
		const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(ddmmyyyy ?? '');
		return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
	}
	/** @param {string} iso → „dd.mm.yyyy" für den Server */
	function fromDateInput(iso) {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
		return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
	}

	const emptyRoom = () => ({
		roomName: '',
		invigilatorID: 0,
		duration: 0,
		studentCount: 0,
		isReserve: false,
		isHandicap: false
	});

	function openAdd() {
		editing = { ancode: '', date: '', time: '', rooms: [emptyRoom()] };
		origAncode = 0;
		isNew = true;
		editError = '';
	}
	/** @param {any} ex */
	function openEdit(ex) {
		editing = {
			ancode: ex.ancode,
			date: toDateInput(ex.date),
			time: ex.time ?? '',
			rooms: (ex.rooms ?? []).map((/** @type {any} */ r) => ({ ...r }))
		};
		origAncode = ex.ancode;
		isNew = false;
		editError = '';
	}
	const closeEdit = () => (editing = null);
	const addRoom = () => (editing.rooms = [...editing.rooms, emptyRoom()]);
	/** @param {number} i */
	const rmRoom = (i) =>
		(editing.rooms = editing.rooms.filter(
			(/** @type {any} */ _, /** @type {number} */ j) => j !== i
		));

	async function save() {
		const ancode = Number(editing.ancode);
		if (!ancode) {
			editError = 'Ancode ist Pflicht.';
			return;
		}
		if (!editing.date) {
			editError = 'Datum ist Pflicht.';
			return;
		}
		saving = true;
		editError = '';
		try {
			const input = {
				ancode,
				date: fromDateInput(editing.date),
				time: editing.time || null,
				rooms: editing.rooms
					.filter((/** @type {any} */ r) => r.roomName)
					.map((/** @type {any} */ r) => ({
						roomName: r.roomName,
						invigilatorID: Number(r.invigilatorID) || 0,
						duration: Number(r.duration) || 0,
						studentCount: Number(r.studentCount) || 0,
						isReserve: !!r.isReserve,
						isHandicap: !!r.isHandicap
					}))
			};
			const res = await fetch('/api/upsertAdditionalExam', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				editError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			// Ancode geändert → alten Eintrag löschen
			if (!isNew && origAncode && origAncode !== ancode) {
				await fetch('/api/deleteAdditionalExam', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ ancode: origAncode })
				});
			}
			closeEdit();
			await invalidateAll();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	/** @param {any} ex */
	async function del(ex) {
		if (!confirm(`Zusätzliche Prüfung ${ex.ancode} löschen?`)) return;
		listError = '';
		try {
			const res = await fetch('/api/deleteAdditionalExam', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: ex.ancode })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				listError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
		} catch (e) {
			listError = e instanceof Error ? e.message : String(e);
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Zusätzliche Prüfungen</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.exams.length}</span>
		<span class="text-sm text-base-content/50">nur für die ZPA-Veröffentlichung</span>
		<div class="flex-1"></div>
		<button class="btn btn-primary btn-sm" on:click={openAdd}>+ Prüfung</button>
	</div>

	{#if listError}
		<div class="alert alert-error py-2 text-sm"><span>{listError}</span></div>
	{/if}

	{#if data.exams.length === 0}
		<div class="text-sm text-base-content/50">Noch keine zusätzlichen Prüfungen angelegt.</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>AnCode</th>
						<th>Datum</th>
						<th>Zeit</th>
						<th>Räume / Aufsichten</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.exams as ex (ex.ancode)}
						<tr class="hover">
							<td class="font-mono font-medium tabular-nums">{ex.ancode}</td>
							<td class="tabular-nums">{ex.date}</td>
							<td class="tabular-nums">{ex.time || '—'}</td>
							<td>
								<div class="flex flex-col gap-1">
									{#each ex.rooms ?? [] as r}
										<div class="flex flex-wrap items-center gap-1 text-sm">
											<span class="badge badge-ghost badge-sm font-mono">{r.roomName}</span>
											{#if r.isReserve}<span class="badge badge-warning badge-xs">Reserve</span
												>{/if}
											{#if r.isHandicap}<span class="badge badge-info badge-xs">NTA</span>{/if}
											<span class="text-base-content/60">
												{teacherName.get(r.invigilatorID) ?? (r.invigilatorID || '—')}
											</span>
											<span class="text-base-content/40 tabular-nums">
												· {r.studentCount} Stud · {r.duration} min
											</span>
										</div>
									{:else}
										<span class="text-base-content/40">—</span>
									{/each}
								</div>
							</td>
							<td class="text-right whitespace-nowrap">
								<button class="btn btn-ghost btn-xs" on:click={() => openEdit(ex)}
									>Bearbeiten</button
								>
								<WriteButton class="btn btn-ghost btn-xs text-error" on:click={() => del(ex)}
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

{#if editing}
	<div class="modal modal-open">
		<div class="modal-box max-w-3xl">
			<h2 class="text-lg font-semibold">
				Zusätzliche Prüfung {isNew ? 'anlegen' : editing.ancode}
			</h2>
			<div class="mt-3 flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">AnCode</span>
					<input
						type="number"
						class="input input-bordered input-sm w-28 tabular-nums"
						bind:value={editing.ancode}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Datum</span>
					<input type="date" class="input input-bordered input-sm" bind:value={editing.date} />
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Zeit</span>
					<input type="time" class="input input-bordered input-sm" bind:value={editing.time} />
				</label>
			</div>

			<div class="mt-4 flex items-center gap-2">
				<span class="font-medium">Räume / Aufsichten</span>
				<span class="badge badge-ghost badge-sm">{editing.rooms.length}</span>
				<button class="btn btn-ghost btn-xs" on:click={addRoom}>+ Raum</button>
			</div>
			<div class="mt-1 flex flex-col gap-2">
				{#each editing.rooms as r, i}
					<div class="flex flex-wrap items-end gap-2 rounded-lg border border-base-300 p-2">
						<label class="flex flex-col gap-1">
							<span class="text-xs text-base-content/50">Raum</span>
							<select class="select select-bordered select-xs w-32" bind:value={r.roomName}>
								<option value="">—</option>
								{#each data.rooms as name}
									<option value={name}>{name}</option>
								{/each}
							</select>
						</label>
						<label class="flex flex-col gap-1">
							<span class="text-xs text-base-content/50">Aufsicht</span>
							<select class="select select-bordered select-xs w-48" bind:value={r.invigilatorID}>
								<option value={0}>—</option>
								{#each data.teachers as t}
									<option value={t.id}>{t.fullname}</option>
								{/each}
							</select>
						</label>
						<label class="flex flex-col gap-1">
							<span class="text-xs text-base-content/50">Studis</span>
							<input
								type="number"
								class="input input-bordered input-xs w-20 tabular-nums"
								bind:value={r.studentCount}
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span class="text-xs text-base-content/50">Dauer</span>
							<input
								type="number"
								class="input input-bordered input-xs w-20 tabular-nums"
								bind:value={r.duration}
							/>
						</label>
						<label class="flex cursor-pointer items-center gap-1 text-sm">
							<input type="checkbox" class="checkbox checkbox-xs" bind:checked={r.isReserve} /> Reserve
						</label>
						<label class="flex cursor-pointer items-center gap-1 text-sm">
							<input type="checkbox" class="checkbox checkbox-xs" bind:checked={r.isHandicap} /> NTA
						</label>
						<button class="btn btn-ghost btn-xs text-error" on:click={() => rmRoom(i)}>✕</button>
					</div>
				{/each}
			</div>

			{#if editError}
				<div class="alert alert-error mt-3 py-2 text-sm"><span>{editError}</span></div>
			{/if}
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" on:click={closeEdit} disabled={saving}
					>Abbrechen</button
				>
				<WriteButton class="btn btn-primary btn-sm" on:click={save} disabled={saving}>
					{saving ? 'speichert …' : 'Speichern'}
				</WriteButton>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={closeEdit}></button>
	</div>
{/if}
