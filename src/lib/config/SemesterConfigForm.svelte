<script>
	// Wiederverwendbares Formular für die Semester-Config (bearbeiten + neu anlegen).
	// Initialwerte über `config` (null = leer). Das gebaute Input liefert getInput().
	//
	// `form` ist tief mit `bind:` verdrahtet (bind:value auf verschachtelte Felder,
	// Anfangszeiten-/Sperrtag-Arrays, MUC.DAI-Set) und muss daher ein tief-reaktiver
	// $state bleiben — ein writable $derived würde die bind:-Reaktivität brechen. Beim
	// Config-Wechsel (nach dem Speichern lädt /config die neu berechnete Config)
	// setzt der Aufrufer das Formular per {#key config} zurück (Remount), statt hier
	// einen run()/$effect-Reset zu fahren.

	/**
	 * @typedef {Object} Props
	 * @property {any} [config]
	 * @property {{ number: number, date: string }[] | null} [days] Prüfungstage vom
	 *   Backend (semesterConfig.days). Wenn gesetzt, liefern sie die Spalten der
	 *   MUC.DAI-Matrix; sonst werden sie aus from/until abgeleitet (z. B. beim
	 *   Anlegen eines neuen Semesters, für das das Backend noch keine Tage kennt).
	 * @property {{ maxSeatsPerSlot: number } | null} [effective] Effektive, aus der
	 *   Config berechnete Werte (SemesterConfig) für Hinweistexte. null = frisches
	 *   Semester ohne Config.
	 */

	/** @type {Props} */
	let { config = null, days = null, effective = null } = $props();

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
			startTimes: [...(c.startTimes ?? [])],
			/** @type {string[]} */
			forbiddenDays: [...(c.forbiddenDays ?? [])],
			// MUC.DAI: Menge absoluter Anfangszeiten (Time-Strings), wie vom Backend geliefert.
			/** @type {Set<string>} */
			mucDai: new Set(c.mucDaiAllowedTimes ?? []),
			// Zeitabstände (optional; Default 15 / 120). '' = leer → null an das Backend.
			/** @type {number | ''} */
			timelagMin: c.timelagMin ?? 15,
			/** @type {number | ''} */
			notTooCloseMinutes: c.notTooCloseMinutes ?? 120,
			// Reisezeit zwischen Campus (optional; leer → Backend-Default 120).
			/** @type {number | ''} */
			crossCampusGapMinutes: c.crossCampusGapMinutes ?? '',
			// Max. Plätze pro Startzeit (optional; leer/0 = unbegrenzt).
			/** @type {number | ''} */
			maxSeatsPerSlot: c.maxSeatsPerSlot ?? '',
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

	const addStartTime = () => (form.startTimes = [...form.startTimes, '']);
	/** @param {number} i */
	const rmStartTime = (i) => (form.startTimes = form.startTimes.filter((_, j) => j !== i));
	const addForbidden = () => (form.forbiddenDays = [...form.forbiddenDays, '']);
	/** @param {number} i */
	const rmForbidden = (i) => (form.forbiddenDays = form.forbiddenDays.filter((_, j) => j !== i));
	const addExaminer = () => (form.emails.additionalExamer = [...form.emails.additionalExamer, '']);
	/** @param {number} i */
	const rmExaminer = (i) =>
		(form.emails.additionalExamer = form.emails.additionalExamer.filter((_, j) => j !== i));

	// ---- MUC.DAI-Matrix (Zeilen = Anfangszeit, Spalten = Prüfungstag/Datum) ----
	// Jede angekreuzte Zelle entspricht einer absoluten Anfangszeit (Time), gebildet
	// aus dem Datum des Tages + der Uhrzeit der Zeile.
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

	/** @param {{ number: number, date: string }[]} list */
	function daysFromBackend(list) {
		return (list ?? []).map((d) => {
			const iso = String(d.date).slice(0, 10);
			return { number: d.number, iso, date: d.date, ...fmtDay(iso) };
		});
	}

	// Fallback (neues Semester): Prüfungstage = Werktage (Mo–Fr) zwischen from und
	// until, fortlaufend ab Tag 1 = from. Wochenenden werden übersprungen. Für ein
	// bestehendes Semester liefert stattdessen das Backend die Tage (days-Prop).
	/** @param {string} fromIso @param {string} untilIso */
	function examDays(fromIso, untilIso) {
		const f = (fromIso ?? '').slice(0, 10);
		const u = (untilIso ?? '').slice(0, 10);
		/** @type {{number:number, wd:string, label:string, iso:string, date:string}[]} */
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
				out.push({ number: n, iso, date: iso, ...fmtDay(iso) });
			}
			cur.setUTCDate(cur.getUTCDate() + 1);
			if (n > 200) break; // Sicherung
		}
		return out;
	}

	// Spalten: Backend-Tage bevorzugen; sonst lokal aus from/until (neues Semester).
	let matrixDays = $derived(
		days && days.length ? daysFromBackend(days) : examDays(form.from, form.until)
	);
	// Zeilen aus den (editierbaren) Anfangszeiten; leere Zeilen werden ausgelassen.
	let matrixRows = $derived(
		form.startTimes.map((t, i) => ({ n: i + 1, time: (t ?? '').trim() })).filter((r) => r.time)
	);
	let forbiddenSet = $derived(
		new Set(form.forbiddenDays.filter(Boolean).map((/** @type {string} */ x) => x.slice(0, 10)))
	);

	// Absolute Anfangszeit (Time-String) einer Zelle: Datum des Tages + Uhrzeit der Zeile,
	// in der Zeitzone des Backend-Datums (bzw. Z für lokal berechnete Tage).
	/** @param {{ iso: string, date?: string }} day @param {string} time */
	function cellTime(day, time) {
		const full = String(day.date ?? '');
		const datePart = (full || day.iso).slice(0, 10);
		const tz = full.length > 19 ? full.slice(19) : 'Z';
		return `${datePart}T${(time ?? '').slice(0, 5)}:00${tz}`;
	}
	// Vergleich auf Minutengenauigkeit — robust gegen Sekunden/Format-Abweichungen
	// zwischen dem, was wir senden, und dem, was das Backend zurückgibt.
	/** @param {string} t */
	const timeKey = (t) => String(t).slice(0, 16);
	/** Vorhandenes Set-Mitglied für die Zelle (oder null).
	 * @param {Set<string>} s @param {{ iso: string, date?: string }} day @param {string} time */
	function cellMember(s, day, time) {
		const k = timeKey(cellTime(day, time));
		for (const m of s) if (timeKey(m) === k) return m;
		return null;
	}

	/** @param {{ iso: string, date?: string }} day @param {string} time */
	const cellChecked = (day, time) => !!cellMember(form.mucDai, day, time);
	/** @param {{ iso: string, date?: string }} day @param {string} time */
	function toggleCell(day, time) {
		const s = new Set(form.mucDai);
		const ex = cellMember(s, day, time);
		if (ex) s.delete(ex);
		else s.add(cellTime(day, time));
		form.mucDai = s;
	}
	/** Spalte (Tag) umschalten: an, wenn noch nicht alle gesetzt sind, sonst aus.
	 * @param {{ iso: string, date?: string }} day */
	function toggleDay(day) {
		const s = new Set(form.mucDai);
		const allSet = matrixRows.every((r) => cellMember(s, day, r.time));
		for (const r of matrixRows) {
			const ex = cellMember(s, day, r.time);
			if (allSet && ex) s.delete(ex);
			else if (!allSet && !ex) s.add(cellTime(day, r.time));
		}
		form.mucDai = s;
	}
	/** Zeile (Anfangszeit) umschalten.
	 * @param {string} time */
	function toggleTimeRow(time) {
		const s = new Set(form.mucDai);
		const allSet = matrixDays.every((d) => cellMember(s, d, time));
		for (const d of matrixDays) {
			const ex = cellMember(s, d, time);
			if (allSet && ex) s.delete(ex);
			else if (!allSet && !ex) s.add(cellTime(d, time));
		}
		form.mucDai = s;
	}
	const clearMucDai = () => (form.mucDai = new Set());

	/** @param {number | ''} v */
	const intOrNull = (v) => (v === '' || v == null ? null : Number(v));

	// Das fertige SemesterConfigInputData-Objekt (vom Eltern-Page aufgerufen).
	export function getInput() {
		return {
			from: form.from,
			until: form.until,
			startTimes: form.startTimes.map((s) => s.trim()).filter(Boolean),
			forbiddenDays: form.forbiddenDays.filter(Boolean),
			// Menge absoluter Anfangszeiten (Time-Strings), sortiert
			mucDaiAllowedTimes: [...form.mucDai].sort(),
			timelagMin: intOrNull(form.timelagMin),
			notTooCloseMinutes: intOrNull(form.notTooCloseMinutes),
			crossCampusGapMinutes: intOrNull(form.crossCampusGapMinutes),
			maxSeatsPerSlot: intOrNull(form.maxSeatsPerSlot),
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

	<!-- Anfangszeiten -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex items-center gap-2">
			<span class="font-semibold">Anfangszeiten</span>
			<span class="badge badge-ghost badge-sm">{form.startTimes.length}</span>
			<button class="btn btn-ghost btn-xs" onclick={addStartTime}>+ Anfangszeit</button>
		</div>
		{#if form.startTimes.length === 0}
			<div class="text-xs text-base-content/50">keine</div>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each form.startTimes as _, i}
					<div class="flex items-center gap-1">
						<span class="text-xs text-base-content/50">{i + 1}.</span>
						<input
							type="time"
							class="input input-bordered input-sm w-28"
							bind:value={form.startTimes[i]}
						/>
						<button class="btn btn-ghost btn-xs text-error" onclick={() => rmStartTime(i)}>✕</button
						>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Zeitabstände & Kapazität -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="font-semibold">Zeitabstände &amp; Kapazität</div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Turnaround Raum/Aufsicht, Min</span>
				<input
					type="number"
					min="0"
					class="input input-bordered input-sm w-32"
					bind:value={form.timelagMin}
				/>
				<span class="text-[11px] text-base-content/40">Default 15</span>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">zu nah ab, Min</span>
				<input
					type="number"
					min="0"
					class="input input-bordered input-sm w-32"
					bind:value={form.notTooCloseMinutes}
				/>
				<span class="text-[11px] text-base-content/40">Default 120</span>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Reisezeit zwischen Campus, Min</span>
				<input
					type="number"
					min="0"
					placeholder="120"
					class="input input-bordered input-sm w-32"
					bind:value={form.crossCampusGapMinutes}
				/>
				<span class="text-[11px] text-base-content/40">leer = 120</span>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Max. Plätze pro Startzeit</span>
				<input
					type="number"
					min="0"
					placeholder="0"
					class="input input-bordered input-sm w-32"
					bind:value={form.maxSeatsPerSlot}
				/>
				<span class="text-[11px] text-base-content/40">
					0 = unbegrenzt{#if effective}
						· effektiv: {effective.maxSeatsPerSlot === 0
							? 'unbegrenzt'
							: effective.maxSeatsPerSlot}{/if}
				</span>
			</label>
		</div>
		<p class="text-xs text-base-content/50">
			„Max. Plätze pro Startzeit" begrenzt, wie viele Studierende gleichzeitig (zur selben
			Startzeit) geprüft werden — für feinere Startzeiten/Morgen-Packung; 0 = unbegrenzt.
		</p>
		<p class="text-xs text-base-content/50">
			„Reisezeit zwischen Campus" ist der harte End-zu-Start-Mindestabstand zwischen zwei Prüfungen
			eines Studierenden an verschiedenen Standorten; leer = 120.
		</p>
	</div>

	<!-- MUC.DAI-Anfangszeiten als Matrix: Zeilen = Uhrzeit, Spalten = Prüfungstag/Datum -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex flex-wrap items-center gap-2">
			<span class="font-semibold">MUC.DAI-Anfangszeiten</span>
			<span class="badge badge-ghost badge-sm">{form.mucDai.size}</span>
			<div class="flex-1"></div>
			<button class="btn btn-ghost btn-xs" onclick={clearMucDai} disabled={form.mucDai.size === 0}>
				alle abwählen
			</button>
		</div>
		<p class="text-xs text-base-content/50">
			Ankreuzen, zu welchen Terminen MUC.DAI-Prüfungen beginnen dürfen. Klick auf einen Spalten-
			oder Zeilenkopf schaltet die ganze Spalte/Zeile um.
		</p>
		<p class="text-xs text-base-content/50">
			Üblicherweise an Tag 1 nachmittags und dann immer abwechselnd vor- und nachmittags.
		</p>
		{#if matrixDays.length === 0 || matrixRows.length === 0}
			<div class="text-xs text-base-content/50">
				Bitte zuerst Zeitraum (von/bis) und Anfangszeiten setzen.
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
										onclick={() => toggleDay(d)}
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
										title="{r.time} – ganze Zeile umschalten"
										onclick={() => toggleTimeRow(r.time)}
									>
										<span class="tabular-nums">{r.time}</span>
									</button>
								</th>
								{#each matrixDays as d}
									<td class="p-0 text-center {forbiddenSet.has(d.iso) ? 'bg-base-200/50' : ''}">
										<input
											type="checkbox"
											class="checkbox checkbox-xs"
											checked={cellChecked(d, r.time)}
											onchange={() => toggleCell(d, r.time)}
											title="Tag {d.number} ({d.wd} {d.label}) · {r.time}"
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
								class="input input-bordered input-sm w-full sm:w-80"
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
