<script>
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';

	let { data } = $props();

	// ---- Time-Scalar (ISO mit Offset) direkt am String verarbeiten ----
	/** @param {string} iso */
	const datePart = (iso) => /^(\d{4}-\d{2}-\d{2})/.exec(iso ?? '')?.[1] ?? '';
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
	/** Offset (z. B. +02:00 / Z) aus einem ISO-Zeitstempel. @param {string} iso */
	const offsetPart = (iso) => /T\d{2}:\d{2}(?::\d{2})?(.*)$/.exec(iso ?? '')?.[1] ?? '';
	/** voller Time-Wert aus Tages-ISO + HH:MM. @param {string} dayIso @param {string} hhmm */
	const mkTime = (dayIso, hhmm) => `${datePart(dayIso)}T${hhmm}:00${offsetPart(dayIso)}`;

	/** Tages-ISO zu einem Datums-Teil (YYYY-MM-DD). @param {string} dp */
	const dayIsoFor = (dp) =>
		data.days.find((/** @type {any} */ d) => datePart(d.date) === dp)?.date ?? '';

	let existingIds = $derived(new Set(data.constraints.map((/** @type {any} */ c) => c.teacherID)));
	let permByTeacher = $derived(
		new Map(data.permanent.map((/** @type {any} */ p) => [p.teacherID, p]))
	);
	// per-Semester-Dropdown: Kandidaten ohne Semester-Eintrag und nicht permanent
	let addableTeachers = $derived(
		data.candidates.filter(
			(/** @type {any} */ t) => !existingIds.has(t.id) && !permByTeacher.has(t.id)
		)
	);
	let firstDayPart = $derived(data.days.length ? datePart(data.days[0].date) : '');

	// alle Aufsichten anzeigen (auch ohne Constraints) — Zeilen entsprechend ableiten
	let showAll = $state(false);
	let constraintByTeacher = $derived(
		new Map(data.constraints.map((/** @type {any} */ c) => [c.teacherID, c]))
	);
	let rows = $derived(
		showAll
			? data.candidates.map(
					(/** @type {any} */ t) =>
						constraintByTeacher.get(t.id) ?? {
							teacherID: t.id,
							shortname: t.shortname,
							fullname: t.fullname,
							isNotInvigilator: false,
							excludedDates: [],
							timeWindows: [],
							_empty: true
						}
				)
			: data.constraints
	);

	// ---- Editor-Zustand ----
	/** @type {number | null} */
	let editing = $state(null);
	let editName = $state('');
	let editIsNot = $state(false);
	/** @type {string[]} Datums-Teile (YYYY-MM-DD) */
	let editExcluded = $state([]);
	/** @type {{ date: string, from: string, until: string }[]} */
	let editWindows = $state([]);
	let isNew = $state(false);
	let editError = $state('');
	let saving = $state(false);

	let addTeacherID = $state(0);
	let listError = $state('');

	/** @param {any} c */
	function openEdit(c) {
		editing = c.teacherID;
		editName = `${c.shortname}${c.fullname ? ` (${c.fullname})` : ''}`;
		editIsNot = c.isNotInvigilator;
		editExcluded = (c.excludedDates ?? []).map((/** @type {string} */ d) => datePart(d));
		editWindows = (c.timeWindows ?? []).map((/** @type {any} */ w) => ({
			date: datePart(w.date),
			from: fmtTime(w.from),
			until: fmtTime(w.until)
		}));
		isNew = !!c._empty;
		editError = '';
	}

	function openAdd() {
		const id = Number(addTeacherID);
		if (!id) return;
		const t = data.candidates.find((/** @type {any} */ x) => x.id === id);
		editing = id;
		editName = t ? `${t.shortname}${t.fullname ? ` (${t.fullname})` : ''}` : `#${id}`;
		editIsNot = false;
		editExcluded = [];
		editWindows = [];
		isNew = true;
		editError = '';
	}

	function closeEdit() {
		editing = null;
	}

	function addExcluded() {
		editExcluded = [...editExcluded, firstDayPart];
	}
	/** @param {number} i */
	function removeExcluded(i) {
		editExcluded = editExcluded.filter((_, j) => j !== i);
	}
	function addWindow() {
		editWindows = [...editWindows, { date: firstDayPart, from: '', until: '' }];
	}
	/** @param {number} i */
	function removeWindow(i) {
		editWindows = editWindows.filter((_, j) => j !== i);
	}

	async function save() {
		editError = '';
		// Validierung der Sperrfenster
		for (const [i, w] of editWindows.entries()) {
			if (!w.date) {
				editError = `Sperrfenster ${i + 1}: Datum fehlt.`;
				return;
			}
			if (!w.from && !w.until) {
				editError = `Sperrfenster ${i + 1}: mindestens „von“ oder „bis“ angeben.`;
				return;
			}
			if (w.from && w.until && w.until <= w.from) {
				editError = `Sperrfenster ${i + 1}: „bis“ muss nach „von“ liegen.`;
				return;
			}
		}
		const input = {
			teacherID: editing,
			isNotInvigilator: editIsNot,
			excludedDates: editExcluded.map((dp) => dayIsoFor(dp)).filter(Boolean),
			timeWindows: editWindows.map((w) => {
				const dayIso = dayIsoFor(w.date);
				return {
					date: dayIso,
					from: w.from ? mkTime(dayIso, w.from) : null,
					until: w.until ? mkTime(dayIso, w.until) : null
				};
			})
		};
		saving = true;
		try {
			const res = await fetch('/api/setInvigilatorConstraints', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				editError = result?.error ?? `Fehler (HTTP ${res.status})`;
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

	/** @param {any} c */
	async function del(c) {
		if (!confirm(`Aufsichts-Constraints für ${c.shortname} löschen?`)) return;
		listError = '';
		try {
			const res = await fetch('/api/deleteInvigilatorConstraints', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ teacherID: c.teacherID })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				listError = result?.error ?? `Fehler (HTTP ${res.status})`;
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
		<h1 class="text-2xl font-semibold">Aufsichts-Constraints</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.constraints.length}</span>
	</div>
	<p class="max-w-3xl text-sm text-base-content/60">
		Vom Planer gepflegte Constraints je Aufsicht — <strong>zusätzlich</strong> zu den ZPA-Sperrtagen
		(„Anforderungen und Planung“), getrennt davon. <strong>Permanente</strong> Nicht-Aufsichten (z.
		B. pensioniert) gelten semesterübergreifend; <strong>semesterspezifische</strong> (z. B. Mutterschutz)
		nur dieses Semester.
	</p>

	<!-- Semesterspezifisch: Hinzufügen + Anzeige-Toggle -->
	<div class="text-sm font-medium">Semesterspezifische Constraints</div>
	<div class="flex flex-wrap items-end gap-4 rounded-lg border border-base-300 bg-base-100 p-3">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Aufsicht</span>
			<select class="select select-bordered select-sm w-72" bind:value={addTeacherID}>
				<option value={0}>Aufsicht wählen…</option>
				{#each addableTeachers as t}
					<option value={t.id}>{t.shortname} ({t.fullname})</option>
				{/each}
			</select>
		</label>
		<button class="btn btn-primary btn-sm" disabled={!addTeacherID} onclick={openAdd}>
			Constraints anlegen
		</button>
		<div class="flex-1"></div>
		<label class="label cursor-pointer gap-2">
			<input type="checkbox" class="toggle toggle-sm" bind:checked={showAll} />
			<span class="label-text">alle Aufsichten anzeigen</span>
		</label>
	</div>

	{#if listError}
		<div class="alert alert-error py-2 text-sm"><span>{listError}</span></div>
	{/if}

	<!-- Liste -->
	{#if rows.length === 0}
		<div class="text-sm text-base-content/50">
			{showAll ? 'Keine Aufsichten vorhanden.' : 'Noch keine Aufsichts-Constraints angelegt.'}
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Aufsicht</th>
						<th>Status</th>
						<th>Sperrtage</th>
						<th>Sperrfenster</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each rows as c (c.teacherID)}
						{@const perm = permByTeacher.get(c.teacherID)}
						<tr class="hover {c._empty && !perm ? 'opacity-60' : ''}">
							<td>
								<div class="font-medium">{c.shortname}</div>
								{#if c.fullname}<div class="text-xs text-base-content/50">{c.fullname}</div>{/if}
							</td>
							<td>
								{#if perm}
									<span class="badge badge-neutral badge-sm">keine Aufsichten (permanent)</span>
									<div class="text-xs text-base-content/50">{perm.reason}</div>
								{:else if c.isNotInvigilator}
									<span class="badge badge-error badge-sm">keine Aufsichten (Semester)</span>
								{:else if c._empty}
									<span class="text-base-content/40">ohne Constraints</span>
								{:else}
									<span class="text-base-content/50">—</span>
								{/if}
							</td>
							<td>
								{#if c.excludedDates.length}
									<div class="flex flex-wrap gap-1">
										{#each c.excludedDates as d}
											<span class="badge badge-outline badge-xs">{fmtDate(d)}</span>
										{/each}
									</div>
								{:else}
									<span class="text-base-content/40">—</span>
								{/if}
							</td>
							<td>
								{#if c.timeWindows.length}
									<div class="flex flex-wrap gap-1">
										{#each c.timeWindows as w}
											<span class="badge badge-outline badge-xs">
												{fmtDate(w.date)}
												{w.from ? fmtTime(w.from) : '…'}–{w.until ? fmtTime(w.until) : '…'}
											</span>
										{/each}
									</div>
								{:else}
									<span class="text-base-content/40">—</span>
								{/if}
							</td>
							<td class="text-right whitespace-nowrap">
								{#if perm}
									<span class="text-xs text-base-content/40"
										>permanent — kein Semester-Eintrag nötig</span
									>
								{:else}
									<button class="btn btn-ghost btn-xs" onclick={() => openEdit(c)}>
										{c._empty ? 'Anlegen' : 'Bearbeiten'}
									</button>
									{#if !c._empty}
										<WriteButton class="btn btn-ghost btn-xs text-error" onclick={() => del(c)}
											>Löschen</WriteButton
										>
									{/if}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Permanente Nicht-Aufsichten: nur Hinweis; Verwaltung unter Stammdaten → Aufsichten -->
	<p class="text-xs text-base-content/50">
		<strong>Permanente</strong> Nicht-Aufsichten ({data.permanent.length}) werden unter
		<a class="link" href="/invigilators">Stammdaten → Aufsichten</a>
		verwaltet (semesterübergreifend) und erscheinen oben mit dem Badge „permanent".
	</p>
</div>

<!-- Editor -->
{#if editing != null}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h2 class="text-lg font-semibold">
				Aufsichts-Constraints — {editName}
				{#if isNew}<span class="badge badge-info badge-sm">neu</span>{/if}
			</h2>

			<label class="mt-3 flex cursor-pointer items-center gap-2">
				<input type="checkbox" class="checkbox checkbox-sm" bind:checked={editIsNot} />
				<span>macht keine Aufsichten</span>
			</label>

			<!-- Sperrtage -->
			<div class="mt-4 flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<span class="font-medium">Zusätzliche Sperrtage</span>
					<button class="btn btn-ghost btn-xs" onclick={addExcluded}>+ Sperrtag</button>
				</div>
				{#if editExcluded.length === 0}
					<div class="text-xs text-base-content/50">keine</div>
				{:else}
					{#each editExcluded as _, i}
						<div class="flex items-center gap-2">
							<select class="select select-bordered select-sm" bind:value={editExcluded[i]}>
								{#each data.days as d}
									<option value={datePart(d.date)}>{fmtDate(d.date)}</option>
								{/each}
							</select>
							<button class="btn btn-ghost btn-xs text-error" onclick={() => removeExcluded(i)}
								>✕</button
							>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Sperrfenster -->
			<div class="mt-4 flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<span class="font-medium">Sperrfenster</span>
					<button class="btn btn-ghost btn-xs" onclick={addWindow}>+ Sperrfenster</button>
				</div>
				<p class="text-xs text-base-content/50">
					Mindestens „von“ oder „bis“ angeben; sind beide gesetzt, muss „bis“ nach „von“ liegen.
				</p>
				{#if editWindows.length === 0}
					<div class="text-xs text-base-content/50">keine</div>
				{:else}
					{#each editWindows as w, i}
						<div class="flex flex-wrap items-center gap-2">
							<select class="select select-bordered select-sm" bind:value={w.date}>
								{#each data.days as d}
									<option value={datePart(d.date)}>{fmtDate(d.date)}</option>
								{/each}
							</select>
							<label class="flex items-center gap-1">
								<span class="text-xs text-base-content/60">von</span>
								<input type="time" class="input input-bordered input-sm" bind:value={w.from} />
							</label>
							<label class="flex items-center gap-1">
								<span class="text-xs text-base-content/60">bis</span>
								<input type="time" class="input input-bordered input-sm" bind:value={w.until} />
							</label>
							<button class="btn btn-ghost btn-xs text-error" onclick={() => removeWindow(i)}
								>✕</button
							>
						</div>
					{/each}
				{/if}
			</div>

			{#if editError}
				<div class="alert alert-error mt-3 py-2 text-sm"><span>{editError}</span></div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={closeEdit} disabled={saving}>Abbrechen</button
				>
				<WriteButton class="btn btn-primary btn-sm" onclick={save} disabled={saving}>
					{saving ? 'speichert…' : 'Speichern'}
				</WriteButton>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={closeEdit}></button>
	</div>
{/if}
