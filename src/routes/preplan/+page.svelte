<script>
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';
	import SubscriptionTerminal from '$lib/SubscriptionTerminal.svelte';

	export let data;

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
		if (n.seatsBooked >= n.seatsNeeded) return { level: 'green', text: 'genug gebucht', deficit: 0 };
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
			if (e.plannedDayNumber !== slot.dayNumber || e.plannedSlotNumber !== slot.slotNumber) continue;
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
	/** @param {any} s → „Mo 13.07., 08:30 Uhr" (Datum/Zeit stecken in starttime) */
	const slotLabel = (s) => {
		const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(String(s.starttime ?? ''));
		if (!m) return `Tag ${s.dayNumber} · Slot ${s.slotNumber}`;
		const [, y, mo, d, hm] = m;
		const wd = WD[new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))).getUTCDay()];
		return `${wd} ${d}.${mo}., ${hm} Uhr`;
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
	let examerQuery = '';

	// Prüfende als „Nachname, Vorname" (letztes Token = Nachname; Titel bleiben beim
	// Vornamen) — alphabetisch nach Nachname, im Editor durchsuchbar.
	/** @param {string} full */
	function examerLabel(full) {
		const parts = (full ?? '').trim().split(/\s+/);
		if (parts.length < 2) return full ?? '';
		return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
	}
	$: teacherOptions = (data.teachers ?? [])
		.map((/** @type {any} */ t) => ({ id: t.id, label: examerLabel(t.fullname) }))
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.label.localeCompare(b.label));
	$: examerFiltered = examerQuery.trim()
		? teacherOptions.filter((/** @type {any} */ o) =>
				o.label.toLowerCase().includes(examerQuery.trim().toLowerCase())
			)
		: teacherOptions;
	$: selectedExamerLabel = editing
		? (teacherOptions.find((/** @type {any} */ o) => o.id === Number(editing.examerID))?.label ?? '')
		: '';

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

	// ---- Constraints-Editor (pro Preplan-Prüfung) ----
	$: examById = new Map(data.exams.map((/** @type {any} */ e) => [e.id, e]));
	/** @param {number} id → „Modul (Nachname, Vorname)" der verknüpften Preplan-Prüfung */
	const moduleOf = (id) => {
		const e = examById.get(id);
		if (!e) return `#${id}`;
		return e.examerName ? `${e.module} (${examerLabel(e.examerName)})` : e.module;
	};

	/** Badges für die Tabellen-Anzeige der Constraints. @param {any} e */
	function conBadges(e) {
		const c = e.constraints;
		if (!c) return [];
		const rc = c.roomConstraints || {};
		/** @type {{ t: string, cls: string }[]} */
		const out = [];
		if (rc.exahm) out.push({ t: 'EXaHM', cls: 'badge-info' });
		if (rc.seb) out.push({ t: 'SEB', cls: 'badge-error' });
		if (rc.lab) out.push({ t: 'Labor', cls: 'badge-neutral' });
		if (rc.placesWithSocket) out.push({ t: 'Steckdosen', cls: 'badge-ghost' });
		if (c.online) out.push({ t: 'Online', cls: 'badge-info' });
		if ((rc.allowedRooms || []).length)
			out.push({ t: `Räume: ${rc.allowedRooms.join(', ')}`, cls: 'badge-ghost' });
		if ((c.sameSlot || []).length)
			out.push({ t: `=Slot: ${c.sameSlot.map(moduleOf).join(', ')}`, cls: 'badge-ghost' });
		if (c.fixedDay) out.push({ t: 'fixer Tag', cls: 'badge-ghost' });
		return out;
	}

	/** @type {any} */
	let conEditing = null;
	/** @type {any} */
	let conForm = null;
	let conSaving = false;
	let conError = '';

	/** @param {any} e */
	function openConstraints(e) {
		const c = e.constraints || {};
		const rc = c.roomConstraints || {};
		conEditing = e;
		conForm = {
			exahm: !!rc.exahm,
			seb: !!rc.seb,
			lab: !!rc.lab,
			placesWithSocket: !!rc.placesWithSocket,
			online: !!c.online,
			allowedRooms: (rc.allowedRooms || []).join(', '),
			sameSlot: [...(c.sameSlot || [])]
		};
		conError = '';
	}
	const closeConstraints = () => (conEditing = null);

	/** @param {number} id */
	function toggleSameSlot(id) {
		conForm.sameSlot = conForm.sameSlot.includes(id)
			? conForm.sameSlot.filter((/** @type {number} */ x) => x !== id)
			: [...conForm.sameSlot, id];
	}

	async function saveConstraints() {
		if (conSaving) return;
		conSaving = true;
		conError = '';
		const c = conEditing.constraints || {};
		const rc = c.roomConstraints || {};
		// editierte Felder überschreiben, alles andere unverändert übernehmen.
		const constraints = {
			notPlannedByMe: c.notPlannedByMe ?? false,
			doNotPublish: c.doNotPublish ?? false,
			online: conForm.online,
			fixedDay: c.fixedDay ?? null,
			fixedTime: c.fixedTime ?? null,
			excludeDays: c.excludeDays ?? [],
			possibleDays: c.possibleDays ?? [],
			sameSlot: conForm.sameSlot.map(Number),
			allowedRooms: conForm.allowedRooms
				.split(/[\s,]+/)
				.map((/** @type {string} */ s) => s.trim())
				.filter(Boolean),
			exahm: conForm.exahm,
			seb: conForm.seb,
			lab: conForm.lab,
			placesWithSocket: conForm.placesWithSocket,
			kdpJiraURL: rc.kdpJiraURL ?? null,
			maxStudents: rc.maxStudents ?? null,
			additionalSeats: rc.additionalSeats ?? null,
			comments: rc.comments ?? null
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
			{validating ? 'prüft …' : '✔ Prüfen'}
		</button>
		<WriteButton
			class="btn btn-secondary btn-sm"
			on:click={generate}
			disabled={validating || generating}
		>
			{generating ? 'verteilt …' : '🤖 Automatisch verteilen'}
		</WriteButton>
		<button class="btn btn-primary btn-sm" on:click={openAdd}>+ Prüfung</button>
	</div>

	<!-- 🔌 Anny importieren → danach Übersicht (seatsBooked) neu laden -->
	<SubscriptionTerminal
		actions={[{ field: 'importAnnyBookings', label: '🔌 Anny-Buchungen importieren' }]}
		on:done={() => invalidateAll()}
	/>

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
		<span class="text-xs opacity-80">
			Constraints (Raum-Einschränkung, gleicher Slot …) werden beim Verknüpfen mit der ZPA-Prüfung
			automatisch übernommen.
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
								{slotLabel(slot)}
								<span class="ml-1 text-xs font-normal text-base-content/50">
									· Tag {slot.dayNumber} / Slot {slot.slotNumber}
								</span>
							{/if}
						</div>

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{#each [{ label: 'EXaHM', color: 'badge-info', need: slot.exahm }, { label: 'SEB', color: 'badge-error', need: slot.seb }] as k}
								{#if k.need.examCount > 0}
									{@const st = roomStatus(k.need)}
								{@const restricted = restrictedRooms(slot, k.label)}
									<div class="rounded border p-2 text-sm {statusBorder(st.level)}">
										<div class="flex flex-wrap items-center gap-2">
											<span class="badge {k.color} badge-sm">{k.label}</span>
											<span class="tabular-nums">{k.need.examCount} Prüfung(en)</span>
											<span class="text-base-content/50">·</span>
											<span class="tabular-nums">{k.need.seatsNeeded} Plätze nötig</span>
											<div class="flex-1"></div>
											<span
												class="font-medium {st.level === 'red'
													? 'text-error'
													: st.level === 'yellow'
														? 'text-warning'
														: st.level === 'green'
															? 'text-success'
															: 'text-base-content/50'}"
											>
												{STATUS_DOT[st.level]}
												{st.text}
											</span>
										</div>

										<div class="mt-1 tabular-nums text-base-content/70">
											gebucht {k.need.seatsBooked} / verfügbar {k.need.seatsAvailable}
										</div>

										{#if restricted.length}
											<div class="mt-1 text-xs text-base-content/60">
												eingeschränkt auf: <span class="font-medium">{restricted.join(', ')}</span>
											</div>
										{/if}

										{#if st.level === 'yellow' && k.need.roomsToBook.length}
											<div class="mt-1 text-xs text-warning">
												noch buchen: <span class="font-medium">{k.need.roomsToBook.join(', ')}</span>
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
								{#if conBadges(e).length}
									<div class="mt-1 flex flex-wrap gap-1">
										{#each conBadges(e) as b}
											<span class="badge {b.cls} badge-xs">{b.t}</span>
										{/each}
									</div>
								{/if}
							</td>
							<td class="text-sm">{examerLabel(e.examerName)}</td>
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
										disabled={busy.has(e.id) || $page.data?.readOnly}
										on:change={(ev) => setSlot(e, ev.currentTarget.value)}
									>
										<option value="">— nicht zugeordnet</option>
										{#each data.slots as s}
											<option value="{s.dayNumber}-{s.slotNumber}">{slotLabel(s)}</option>
										{/each}
									</select>
									{#if slotValue(e)}
										<WriteButton
											class="btn btn-ghost btn-xs text-error"
											title="Slot-Zuordnung aufheben"
											disabled={busy.has(e.id)}
											on:click={() => setSlot(e, '')}
										>
											✕
										</WriteButton>
									{/if}
								</div>
							</td>
							<td>
								{#if e.ancode}
									<span class="badge badge-success badge-sm tabular-nums">✓ {e.ancode}</span>
									<WriteButton class="btn btn-ghost btn-xs" on:click={() => disconnect(e)}
										>Lösen</WriteButton
									>
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
								<button class="btn btn-ghost btn-xs" on:click={() => openConstraints(e)}>
									Constraints
								</button>
								<button class="btn btn-ghost btn-xs" on:click={() => openEdit(e)}>Bearbeiten</button>
								<WriteButton class="btn btn-ghost btn-xs text-error" on:click={() => del(e)}
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
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Art</span>
					<select class="select select-bordered select-sm w-32" bind:value={editing.examKind}>
						<option value="EXaHM">EXaHM</option>
						<option value="SEB">SEB</option>
					</select>
				</label>
				<div class="flex flex-col gap-1 sm:col-span-2">
					<div class="flex items-baseline gap-2">
						<span class="text-xs font-medium text-base-content/60">Prüfender (Nachname, Vorname)</span>
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
					<div class="max-h-60 divide-y divide-base-200 overflow-y-auto rounded-lg border border-base-300">
						{#each examerFiltered as o}
							<button
								type="button"
								class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-base-200 {Number(
									editing.examerID
								) === o.id
									? 'bg-primary/15 font-medium text-primary'
									: ''}"
								on:click={() => (editing.examerID = o.id)}
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
				<WriteButton class="btn btn-primary btn-sm" on:click={save} disabled={saving}>
					{saving ? 'speichert …' : 'Speichern'}
				</WriteButton>
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
				{suggestFor.examKind} · {suggestFor.module} · {examerLabel(suggestFor.examerName)}
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
												on:click={() => connect(s.ancode)}
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
						on:click={() => connect(manualAncode)}
					>
						verknüpfen
					</WriteButton>
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

<!-- Constraints-Editor (pro Preplan-Prüfung) -->
{#if conEditing}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h2 class="text-lg font-semibold">Constraints — {conEditing.module}</h2>
			<p class="mt-1 text-sm text-base-content/60">
				{conEditing.examKind} · {examerLabel(conEditing.examerName)}
			</p>
			<div class="mt-1 text-xs text-base-content/50">
				Constraints werden beim Verknüpfen mit der ZPA-Prüfung automatisch übernommen.
			</div>

			<!-- Raum-Einschränkungen -->
			<div class="mt-3 flex flex-col gap-2 rounded-lg border border-base-300 p-3">
				<span class="text-xs font-medium text-base-content/60">Raum-Einschränkung</span>
				<div class="flex flex-wrap gap-x-4 gap-y-1">
					<label class="flex cursor-pointer items-center gap-1 text-sm">
						<input type="checkbox" class="checkbox checkbox-xs" bind:checked={conForm.exahm} />
						<span>EXaHM</span>
					</label>
					<label class="flex cursor-pointer items-center gap-1 text-sm">
						<input type="checkbox" class="checkbox checkbox-xs" bind:checked={conForm.seb} />
						<span>SEB</span>
					</label>
					<label class="flex cursor-pointer items-center gap-1 text-sm">
						<input type="checkbox" class="checkbox checkbox-xs" bind:checked={conForm.lab} />
						<span>Labor</span>
					</label>
					<label class="flex cursor-pointer items-center gap-1 text-sm">
						<input
							type="checkbox"
							class="checkbox checkbox-xs"
							bind:checked={conForm.placesWithSocket}
						/>
						<span>Steckdosen</span>
					</label>
					<label class="flex cursor-pointer items-center gap-1 text-sm">
						<input type="checkbox" class="checkbox checkbox-xs" bind:checked={conForm.online} />
						<span>Online</span>
					</label>
				</div>
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
								on:change={() => toggleSameSlot(o.id)}
							/>
							<span class="badge badge-xs {o.examKind === 'SEB' ? 'badge-error' : 'badge-info'}">
								{o.examKind}
							</span>
							<span>{o.module}</span>
							<span class="text-base-content/40">· {examerLabel(o.examerName)}</span>
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
				<button class="btn btn-ghost btn-sm" on:click={closeConstraints} disabled={conSaving}>
					Abbrechen
				</button>
				<WriteButton class="btn btn-primary btn-sm" on:click={saveConstraints} disabled={conSaving}>
					{conSaving ? 'speichert …' : 'Speichern'}
				</WriteButton>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={closeConstraints}></button>
	</div>
{/if}
