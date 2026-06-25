<script>
	import { invalidateAll } from '$app/navigation';

	export let data;

	// ---- Time-Helfer: Datum aus ISO ziehen / mit Original-Suffix zurückbauen ----
	/** @param {string} iso */
	const datePart = (iso) => (iso ?? '').slice(0, 10);
	/** @param {string} iso @param {string} dateStr */
	const setDate = (iso, dateStr) => {
		if (!dateStr) return '';
		const suffix = iso && iso.length > 10 ? iso.slice(10) : 'T00:00:00Z';
		return dateStr + suffix;
	};

	/** @param {any} c */
	function initForm(c) {
		c = c || {};
		const e = c.emails || {};
		return {
			from: c.from ?? '',
			fromFK07: c.fromFK07 ?? '',
			until: c.until ?? '',
			goDay0: c.goDay0 ?? '',
			dayNumberStart: c.dayNumberStart ?? 'from',
			/** @type {string[]} */
			slots: [...(c.slots ?? [])],
			/** @type {string[]} */
			forbiddenDays: [...(c.forbiddenDays ?? [])],
			/** @type {number[][]} */
			goSlots: (c.goSlots ?? []).map((/** @type {number[]} */ p) => [p[0], p[1]]),
			emails: {
				profs: e.profs ?? '',
				lbas: e.lbas ?? '',
				lbasLastSemester: e.lbasLastSemester ?? '',
				/** @type {string[]} */
				additionalExamer: [...(e.additionalExamer ?? [])],
				fs: e.fs ?? '',
				sekr: e.sekr ?? '',
				roomManagement: e.roomManagement ?? '',
				kdp: e.kdp ?? '',
				lbaba: e.lbaba ?? ''
			}
		};
	}

	let form = initForm(data.config);
	let lastConfig = data.config;
	// nach erfolgreichem Speichern (invalidateAll) neu aus der Config initialisieren
	$: if (data.config !== lastConfig) {
		form = initForm(data.config);
		lastConfig = data.config;
	}

	// ---- Listen-Helfer ----
	const addSlot = () => (form.slots = [...form.slots, '']);
	/** @param {number} i */
	const rmSlot = (i) => (form.slots = form.slots.filter((_, j) => j !== i));
	const addForbidden = () => (form.forbiddenDays = [...form.forbiddenDays, '']);
	/** @param {number} i */
	const rmForbidden = (i) => (form.forbiddenDays = form.forbiddenDays.filter((_, j) => j !== i));
	const addGoSlot = () => (form.goSlots = [...form.goSlots, [0, 1]]);
	/** @param {number} i */
	const rmGoSlot = (i) => (form.goSlots = form.goSlots.filter((_, j) => j !== i));
	const addExaminer = () => (form.emails.additionalExamer = [...form.emails.additionalExamer, '']);
	/** @param {number} i */
	const rmExaminer = (i) =>
		(form.emails.additionalExamer = form.emails.additionalExamer.filter((_, j) => j !== i));

	// ---- Speichern ----
	let saving = false;
	let errorMsg = '';
	/** @type {string[]} */
	let warnings = [];
	let showWarnings = false;
	let savedAt = '';

	function buildInput() {
		return {
			from: form.from,
			fromFK07: form.fromFK07,
			until: form.until,
			dayNumberStart: String(form.dayNumberStart).trim(),
			slots: form.slots.map((s) => s.trim()).filter(Boolean),
			goDay0: form.goDay0,
			forbiddenDays: form.forbiddenDays.filter(Boolean),
			goSlots: form.goSlots.map((p) => [Number(p[0]), Number(p[1])]),
			emails: {
				profs: form.emails.profs,
				lbas: form.emails.lbas,
				lbasLastSemester: form.emails.lbasLastSemester,
				additionalExamer: form.emails.additionalExamer.map((s) => s.trim()).filter(Boolean),
				fs: form.emails.fs,
				sekr: form.emails.sekr,
				roomManagement: form.emails.roomManagement,
				kdp: form.emails.kdp,
				lbaba: form.emails.lbaba
			}
		};
	}

	async function save() {
		if (saving) return;
		saving = true;
		errorMsg = '';
		warnings = [];
		savedAt = '';
		try {
			const res = await fetch('/api/setSemesterConfigInput', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input: buildInput() })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				errorMsg = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			const out = result.setSemesterConfigInput;
			if (!out?.ok) {
				errorMsg = 'Speichern nicht möglich.';
				return;
			}
			warnings = out.warnings ?? [];
			showWarnings = warnings.length > 0;
			savedAt = new Date().toLocaleTimeString('de-DE');
			// Tage/Slots/Go-Slots wurden neu berechnet → Config neu laden
			await invalidateAll();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Semester-Konfiguration</h1>
		{#if data.semester}<span class="badge badge-primary badge-lg">{data.semester}</span>{/if}
		{#if !data.config}
			<span class="badge badge-warning badge-lg">neu — noch keine Config</span>
		{/if}
	</div>

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}
	{#if savedAt && warnings.length === 0}
		<div class="alert alert-success py-2 text-sm"><span>Gespeichert ({savedAt}).</span></div>
	{/if}

	<!-- Termine -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="font-semibold">Termine</div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">von (from)</span>
				<input
					type="date"
					class="input input-bordered input-sm"
					value={datePart(form.from)}
					on:change={(e) => (form.from = setDate(form.from, e.currentTarget.value))}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">von FK07 (fromFK07)</span>
				<input
					type="date"
					class="input input-bordered input-sm"
					value={datePart(form.fromFK07)}
					on:change={(e) => (form.fromFK07 = setDate(form.fromFK07, e.currentTarget.value))}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">bis (until)</span>
				<input
					type="date"
					class="input input-bordered input-sm"
					value={datePart(form.until)}
					on:change={(e) => (form.until = setDate(form.until, e.currentTarget.value))}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Go-Day 0 (goDay0)</span>
				<input
					type="date"
					class="input input-bordered input-sm"
					value={datePart(form.goDay0)}
					on:change={(e) => (form.goDay0 = setDate(form.goDay0, e.currentTarget.value))}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Tag-Zählung ab (dayNumberStart)</span
				>
				<input
					type="text"
					class="input input-bordered input-sm w-40"
					placeholder="from"
					list="dayNumberStartOpts"
					bind:value={form.dayNumberStart}
				/>
				<datalist id="dayNumberStartOpts">
					<option value="from"></option>
					<option value="fromFK07"></option>
				</datalist>
			</label>
		</div>
	</div>

	<!-- Slots -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex items-center gap-2">
			<span class="font-semibold">Slot-Startzeiten</span>
			<span class="badge badge-ghost badge-sm">{form.slots.length}</span>
			<button class="btn btn-ghost btn-xs" on:click={addSlot}>+ Slot</button>
		</div>
		{#if form.slots.length === 0}
			<div class="text-xs text-base-content/50">keine</div>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each form.slots as _, i}
					<div class="flex items-center gap-1">
						<span class="text-xs text-base-content/50">{i + 1}.</span>
						<input
							type="time"
							class="input input-bordered input-sm w-28"
							bind:value={form.slots[i]}
						/>
						<button class="btn btn-ghost btn-xs text-error" on:click={() => rmSlot(i)}>✕</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Go-Slots -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex items-center gap-2">
			<span class="font-semibold">Go-Slots</span>
			<span class="badge badge-ghost badge-sm">{form.goSlots.length}</span>
			<button class="btn btn-ghost btn-xs" on:click={addGoSlot}>+ Go-Slot</button>
		</div>
		<p class="text-xs text-base-content/50">je Paar: Tag-Offset (ab Go-Day 0) und Slot-Nummer.</p>
		{#if form.goSlots.length === 0}
			<div class="text-xs text-base-content/50">keine</div>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each form.goSlots as _, i}
					<div class="flex items-center gap-1 rounded border border-base-300 px-2 py-1">
						<span class="text-xs text-base-content/50">Tag</span>
						<input
							type="number"
							class="input input-bordered input-xs w-16"
							bind:value={form.goSlots[i][0]}
						/>
						<span class="text-xs text-base-content/50">Slot</span>
						<input
							type="number"
							class="input input-bordered input-xs w-16"
							bind:value={form.goSlots[i][1]}
						/>
						<button class="btn btn-ghost btn-xs text-error" on:click={() => rmGoSlot(i)}>✕</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Sperrtage -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex items-center gap-2">
			<span class="font-semibold">Sperrtage (forbiddenDays)</span>
			<span class="badge badge-ghost badge-sm">{form.forbiddenDays.length}</span>
			<button class="btn btn-ghost btn-xs" on:click={addForbidden}>+ Sperrtag</button>
		</div>
		{#if form.forbiddenDays.length === 0}
			<div class="text-xs text-base-content/50">keine</div>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each form.forbiddenDays as _, i}
					<div class="flex items-center gap-1">
						<input
							type="date"
							class="input input-bordered input-sm"
							value={datePart(form.forbiddenDays[i])}
							on:change={(e) =>
								(form.forbiddenDays[i] = setDate(form.forbiddenDays[i], e.currentTarget.value))}
						/>
						<button class="btn btn-ghost btn-xs text-error" on:click={() => rmForbidden(i)}
							>✕</button
						>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- E-Mails -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="font-semibold">E-Mail-Empfänger</div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Profs</span>
				<input type="text" class="input input-bordered input-sm" bind:value={form.emails.profs} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">LBAs</span>
				<input type="text" class="input input-bordered input-sm" bind:value={form.emails.lbas} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">LBAs (letztes Sem.)</span>
				<input
					type="text"
					class="input input-bordered input-sm"
					bind:value={form.emails.lbasLastSemester}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Fachschaft</span>
				<input type="text" class="input input-bordered input-sm" bind:value={form.emails.fs} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Sekretariat</span>
				<input type="text" class="input input-bordered input-sm" bind:value={form.emails.sekr} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Gebäudemanagement</span>
				<input
					type="text"
					class="input input-bordered input-sm"
					bind:value={form.emails.roomManagement}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">KDP (EXaHM/SEB)</span>
				<input type="text" class="input input-bordered input-sm" bind:value={form.emails.kdp} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">LBA-Beauftragte:r</span>
				<input type="text" class="input input-bordered input-sm" bind:value={form.emails.lbaba} />
			</label>
		</div>
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium">zusätzliche Prüfende (additionalExamer)</span>
				<button class="btn btn-ghost btn-xs" on:click={addExaminer}>+ Adresse</button>
			</div>
			{#if form.emails.additionalExamer.length === 0}
				<div class="text-xs text-base-content/50">keine</div>
			{:else}
				<div class="flex flex-col gap-1">
					{#each form.emails.additionalExamer as _, i}
						<div class="flex items-center gap-1">
							<input
								type="text"
								class="input input-bordered input-sm w-80"
								bind:value={form.emails.additionalExamer[i]}
							/>
							<button class="btn btn-ghost btn-xs text-error" on:click={() => rmExaminer(i)}
								>✕</button
							>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="flex items-center gap-3">
		<button class="btn btn-primary" disabled={saving} on:click={save}>
			{saving ? 'speichert …' : 'Speichern'}
		</button>
		<span class="text-xs text-base-content/50">
			Validierungsfehler (z. B. von &gt; von FK07) meldet der Server.
		</span>
	</div>
</div>

<!-- Hinweise nach erfolgreichem Speichern (nicht-blockierend) -->
{#if showWarnings}
	<div class="modal modal-open">
		<div class="modal-box">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<span class="badge badge-success badge-sm">gespeichert</span> Hinweise
			</h2>
			<ul class="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm">
				{#each warnings as w}
					<li class="text-warning">{w}</li>
				{/each}
			</ul>
			<div class="modal-action">
				<button class="btn btn-sm" on:click={() => (showWarnings = false)}>verstanden</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={() => (showWarnings = false)}
		></button>
	</div>
{/if}
