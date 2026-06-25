<script>
	// Wiederverwendbares Formular für die Semester-Config (bearbeiten + neu anlegen).
	// Initialwerte über `config` (null = leer). Das gebaute Input liefert getInput().
	/** @type {any} */
	export let config = null;

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
			until: c.until ?? '',
			goDay0: c.goDay0 ?? '',
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

	let form = initForm(config);
	let lastConfig = config;
	$: if (config !== lastConfig) {
		form = initForm(config);
		lastConfig = config;
	}

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

	// Das fertige SemesterConfigInputData-Objekt (vom Eltern-Page aufgerufen).
	export function getInput() {
		return {
			from: form.from,
			until: form.until,
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
</script>

<div class="flex flex-col gap-4">
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
		</div>
		<p class="text-xs text-base-content/50">„von (from)" ist der Planungsbeginn = Tag 1.</p>
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
</div>
