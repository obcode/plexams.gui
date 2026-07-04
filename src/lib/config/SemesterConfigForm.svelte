<script>
	// Wiederverwendbares Formular für die Semester-Config (bearbeiten + neu anlegen).
	// Initialwerte über `config` (null = leer). Das gebaute Input liefert getInput().
	//
	// `form` ist tief mit `bind:` verdrahtet (bind:value auf verschachtelte Felder,
	// Slot-/Sperrtag-Arrays, MUC.DAI-Set) und muss daher ein tief-reaktiver $state
	// bleiben — ein writable $derived würde die bind:-Reaktivität brechen. Beim
	// Config-Wechsel (nach dem Speichern lädt /config die neu berechnete Config)
	// setzt der Aufrufer das Formular per {#key config} zurück (Remount), statt hier
	// einen run()/$effect-Reset zu fahren.

	/**
	 * @typedef {Object} Props
	 * @property {any} [config]
	 */

	/** @type {Props} */
	let { config = null } = $props();

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
			/** @type {string[]} */
			slots: [...(c.slots ?? [])],
			/** @type {string[]} */
			forbiddenDays: [...(c.forbiddenDays ?? [])],
			// MUC.DAI-Slots als Set von "tag-slot"-Schlüsseln (absolute Paare, Tag 1 = from)
			/** @type {Set<string>} */
			mucDai: new Set((c.mucDaiSlots ?? []).map((/** @type {number[]} */ p) => `${p[0]}-${p[1]}`)),
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

	let form = $state(initForm(config));

	const addSlot = () => (form.slots = [...form.slots, '']);
	/** @param {number} i */
	const rmSlot = (i) => (form.slots = form.slots.filter((_, j) => j !== i));
	const addForbidden = () => (form.forbiddenDays = [...form.forbiddenDays, '']);
	/** @param {number} i */
	const rmForbidden = (i) => (form.forbiddenDays = form.forbiddenDays.filter((_, j) => j !== i));
	const addExaminer = () => (form.emails.additionalExamer = [...form.emails.additionalExamer, '']);
	/** @param {number} i */
	const rmExaminer = (i) =>
		(form.emails.additionalExamer = form.emails.additionalExamer.filter((_, j) => j !== i));

	// ---- MUC.DAI-Slot-Matrix (Zeilen = Slots/Uhrzeit, Spalten = Prüfungstage/Datum) ----
	const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	/** @param {string} iso */
	const fmtDay = (iso) => {
		const [y, m, d] = iso.split('-').map(Number);
		const dt = new Date(Date.UTC(y, m - 1, d));
		return {
			wd: WD[dt.getUTCDay()],
			label: `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`
		};
	};

	// Prüfungstage = Werktage (Mo–Fr) zwischen from und until, fortlaufend ab Tag 1 = from.
	// Wochenenden werden – wie die ExamDays des Servers – übersprungen.
	/** @param {string} fromIso @param {string} untilIso */
	function examDays(fromIso, untilIso) {
		const f = (fromIso ?? '').slice(0, 10);
		const u = (untilIso ?? '').slice(0, 10);
		/** @type {{number:number, wd:string, label:string, iso:string}[]} */
		const out = [];
		if (!f || !u || f > u) return out;
		let [y, m, d] = f.split('-').map(Number);
		let cur = new Date(Date.UTC(y, m - 1, d));
		const end = new Date(u + 'T00:00:00Z');
		let n = 0;
		while (cur.getTime() <= end.getTime()) {
			const dow = cur.getUTCDay();
			if (dow !== 0 && dow !== 6) {
				n++;
				const iso = cur.toISOString().slice(0, 10);
				out.push({ number: n, iso, ...fmtDay(iso) });
			}
			cur.setUTCDate(cur.getUTCDate() + 1);
			if (n > 200) break; // Sicherung
		}
		return out;
	}

	let matrixDays = $derived(examDays(form.from, form.until));
	// Zeilen aus den (editierbaren) Slot-Startzeiten; Slot-Nr = Position (1-basiert).
	let matrixRows = $derived(
		form.slots.map((t, i) => ({ slotNumber: i + 1, time: (t ?? '').trim() }))
	);
	let forbiddenSet = $derived(
		new Set(form.forbiddenDays.filter(Boolean).map((/** @type {string} */ x) => x.slice(0, 10)))
	);

	/** @param {number} day @param {number} slot @param {Set<string>} mucDai */
	const cellChecked = (day, slot, mucDai) => mucDai.has(`${day}-${slot}`);
	/** @param {number} day @param {number} slot */
	function toggleCell(day, slot) {
		const k = `${day}-${slot}`;
		const s = new Set(form.mucDai);
		if (s.has(k)) s.delete(k);
		else s.add(k);
		form.mucDai = s;
	}
	/** Spalte (Tag) umschalten: an, wenn noch nicht alle gesetzt sind, sonst aus.
	 * @param {number} day */
	function toggleDay(day) {
		const s = new Set(form.mucDai);
		const allSet = matrixRows.every((r) => s.has(`${day}-${r.slotNumber}`));
		for (const r of matrixRows) {
			const k = `${day}-${r.slotNumber}`;
			if (allSet) s.delete(k);
			else s.add(k);
		}
		form.mucDai = s;
	}
	/** Zeile (Slot) umschalten.
	 * @param {number} slot */
	function toggleSlotRow(slot) {
		const s = new Set(form.mucDai);
		const allSet = matrixDays.every((d) => s.has(`${d.number}-${slot}`));
		for (const d of matrixDays) {
			const k = `${d.number}-${slot}`;
			if (allSet) s.delete(k);
			else s.add(k);
		}
		form.mucDai = s;
	}
	const clearMucDai = () => (form.mucDai = new Set());

	// Das fertige SemesterConfigInputData-Objekt (vom Eltern-Page aufgerufen).
	export function getInput() {
		return {
			from: form.from,
			until: form.until,
			slots: form.slots.map((s) => s.trim()).filter(Boolean),
			forbiddenDays: form.forbiddenDays.filter(Boolean),
			// Set → absolute [Tag, Slot]-Paare, sortiert
			mucDaiSlots: [...form.mucDai]
				.map((k) => k.split('-').map(Number))
				.sort((a, b) => a[0] - b[0] || a[1] - b[1]),
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
					onchange={(e) => (form.from = setDate(form.from, e.currentTarget.value))}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">bis (until)</span>
				<input
					type="date"
					class="input input-bordered input-sm"
					value={datePart(form.until)}
					onchange={(e) => (form.until = setDate(form.until, e.currentTarget.value))}
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
			<button class="btn btn-ghost btn-xs" onclick={addSlot}>+ Slot</button>
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
						<button class="btn btn-ghost btn-xs text-error" onclick={() => rmSlot(i)}>✕</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- MUC.DAI-Slots als Matrix: Zeilen = Slot/Uhrzeit, Spalten = Prüfungstag/Datum -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex flex-wrap items-center gap-2">
			<span class="font-semibold">MUC.DAI-Slots</span>
			<span class="badge badge-ghost badge-sm">{form.mucDai.size}</span>
			<div class="flex-1"></div>
			<button class="btn btn-ghost btn-xs" onclick={clearMucDai} disabled={form.mucDai.size === 0}>
				alle abwählen
			</button>
		</div>
		<p class="text-xs text-base-content/50">
			Ankreuzen, welche Tag/Slot-Zellen MUC.DAI-Slots sind. Tag 1 = „von (from)", Wochenenden sind
			ausgelassen. Klick auf einen Spalten- oder Zeilenkopf schaltet die ganze Spalte/Zeile um.
		</p>
		<p class="text-xs text-base-content/50">
			Üblicherweise an Tag 1 Nachmittagsslots und dann immer abwechselnd Vor- und Nachmittags.
		</p>
		{#if matrixDays.length === 0 || matrixRows.length === 0}
			<div class="text-xs text-base-content/50">
				Bitte zuerst Zeitraum (von/bis) und Slot-Startzeiten setzen.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table-xs table w-auto border-separate border-spacing-0.5">
					<thead>
						<tr>
							<th class="bg-base-200 sticky left-0 z-10"></th>
							{#each matrixDays as d}
								<th class="p-0">
									<button
										class="flex w-full flex-col items-center rounded px-1 py-0.5 leading-tight hover:bg-base-200 {forbiddenSet.has(
											d.iso
										)
											? 'text-base-content/40'
											: ''}"
										title="Tag {d.number} – ganze Spalte umschalten{forbiddenSet.has(d.iso)
											? ' (Sperrtag)'
											: ''}"
										onclick={() => toggleDay(d.number)}
									>
										<span class="text-[10px] font-medium">{d.wd}</span>
										<span class="text-[10px] tabular-nums">{d.label}</span>
										<span class="text-[9px] text-base-content/40">#{d.number}</span>
									</button>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each matrixRows as r}
							<tr>
								<th class="bg-base-100 sticky left-0 z-10 p-0 text-right">
									<button
										class="flex w-full items-center justify-end gap-1 rounded px-2 py-0.5 hover:bg-base-200"
										title="Slot {r.slotNumber} – ganze Zeile umschalten"
										onclick={() => toggleSlotRow(r.slotNumber)}
									>
										<span class="tabular-nums">{r.time || `Slot ${r.slotNumber}`}</span>
									</button>
								</th>
								{#each matrixDays as d}
									<td class="p-0 text-center {forbiddenSet.has(d.iso) ? 'bg-base-200/50' : ''}">
										<input
											type="checkbox"
											class="checkbox checkbox-xs"
											checked={cellChecked(d.number, r.slotNumber, form.mucDai)}
											onchange={() => toggleCell(d.number, r.slotNumber)}
											title="Tag {d.number} ({d.wd} {d.label}) · Slot {r.slotNumber} ({r.time})"
										/>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Sperrtage -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex items-center gap-2">
			<span class="font-semibold">Sperrtage (forbiddenDays)</span>
			<span class="badge badge-ghost badge-sm">{form.forbiddenDays.length}</span>
			<button class="btn btn-ghost btn-xs" onclick={addForbidden}>+ Sperrtag</button>
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
							onchange={(e) =>
								(form.forbiddenDays[i] = setDate(form.forbiddenDays[i], e.currentTarget.value))}
						/>
						<button class="btn btn-ghost btn-xs text-error" onclick={() => rmForbidden(i)}>✕</button
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
				<button class="btn btn-ghost btn-xs" onclick={addExaminer}>+ Adresse</button>
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
							<button class="btn btn-ghost btn-xs text-error" onclick={() => rmExaminer(i)}
								>✕</button
							>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
