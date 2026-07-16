<script>
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';
	import DatasetTransfer from '$lib/backup/DatasetTransfer.svelte';
	import { dayNumberForTime, slotNumberForTime } from '$lib/slot/derive';

	let { data } = $props();

	// Zeitbasiert: planEntry hat nur noch starttime; Tag/Slot lokal ableiten.
	/** @param {string | null | undefined} iso */
	const dNum = (iso) => dayNumberForTime(iso, data.semesterConfig?.days);
	/** @param {string | null | undefined} iso */
	const sNum = (iso) => slotNumberForTime(iso, data.semesterConfig?.starttimes);

	// Studienfakultät je Studiengang (JointExam.program → StudyProgram.jointFaculty)
	/** @param {string} p */
	const facultyOfProgram = (p) => data.facultyByProgram?.[p] ?? '';

	let programs = $derived(
		[...new Set(data.jointExams.map((/** @type {any} */ e) => e.program))].sort(
			(/** @type {string} */ a, /** @type {string} */ b) => a.localeCompare(b)
		)
	);

	// gleiche Prüfung (gleicher ZPA-Ancode; sonst primussAncode) über mehrere
	// Studiengänge zu einer Zeile gruppieren
	let groups = $derived(
		(() => {
			/** @type {Map<string, any>} */
			const m = new Map();
			for (const e of data.jointExams) {
				const key = e.ancode != null ? `a${e.ancode}` : `p${e.primussAncode}`;
				let g = m.get(key);
				if (!g) {
					g = {
						ancode: e.ancode,
						primussAncode: e.primussAncode,
						module: e.module,
						mainExamer: e.mainExamer,
						examType: e.examType,
						duration: e.duration,
						isRepeaterExam: e.isRepeaterExam,
						plannedBy: e.plannedBy,
						planEntry: e.planEntry,
						linkStatus: e.linkStatus,
						/** @type {string[]} */
						programs: [],
						/** @type {Set<number>} */
						primussAncodes: new Set(),
						/** @type {{ program: string, primussAncode: number }[]} */
						members: []
					};
					m.set(key, g);
				}
				g.programs.push(e.program);
				g.primussAncodes.add(e.primussAncode);
				g.members.push({ program: e.program, primussAncode: e.primussAncode });
			}
			return [...m.values()].map((g) => {
				const sortedPrograms = g.programs.sort((/** @type {string} */ a, /** @type {string} */ b) =>
					a.localeCompare(b)
				);
				// Studienfakultät der Gruppe = erste zuordenbare (Programme einer Gruppe
				// gehören derselben Fakultät an).
				const faculty = sortedPrograms.map(facultyOfProgram).find(Boolean) ?? '';
				return {
					...g,
					programs: sortedPrograms,
					faculty,
					primussList: [...g.primussAncodes].sort(
						(/** @type {number} */ a, /** @type {number} */ b) => a - b
					)
				};
			});
		})()
	);

	/** @type {string} */
	let program = $state('');
	/** @type {string} '' = alle Studienfakultäten */
	let faculty = $state('');
	let fk07Only = $state(false);

	// alle vorkommenden Studienfakultäten (für den Filter), sortiert
	let faculties = $derived(
		[...new Set(programs.map(facultyOfProgram).filter(Boolean))].sort((a, b) => a.localeCompare(b))
	);
	/** @type {'ancode' | 'time'} */
	let sortBy = $state('ancode');
	// Suche nach Prüfender / Modul / Ancode (ZPA & Primuss)
	let q = $state('');
	let ql = $derived(q.trim().toLowerCase());

	/** @param {any} g → Zeitstempel (ms) für Sortierung; ohne Zeit ans Ende */
	function timeMs(g) {
		const pe = g.planEntry;
		// Die Zeit steht immer in starttime (auch außerhalb des Zeitraums, slotNumber 0).
		const iso = pe?.starttime ?? null;
		if (!iso) return Infinity;
		const t = new Date(iso).getTime();
		return Number.isNaN(t) ? Infinity : t;
	}

	let filtered = $derived(
		groups
			.filter((g) => !program || g.programs.includes(program))
			.filter((g) => !faculty || g.faculty === faculty)
			.filter((g) => !fk07Only || g.plannedBy === 'FK07')
			.filter(
				(g) =>
					!ql ||
					`${g.ancode ?? ''} ${g.primussList.join(' ')} ${g.module} ${g.mainExamer}`
						.toLowerCase()
						.includes(ql)
			)
			.sort((a, b) => {
				if (sortBy === 'time') return timeMs(a) - timeMs(b) || a.primussList[0] - b.primussList[0];
				return a.primussList[0] - b.primussList[0];
			})
	);

	// nach Studienfakultät gruppierte Abschnitte (alphabetisch; ohne Fakultät ans Ende)
	let sections = $derived(
		(() => {
			/** @type {Map<string, any[]>} */
			const m = new Map();
			for (const g of filtered) {
				const key = g.faculty || '—';
				if (!m.has(key)) m.set(key, []);
				m.get(key)?.push(g);
			}
			return [...m.entries()]
				.sort((a, b) => {
					if (a[0] === '—') return 1;
					if (b[0] === '—') return -1;
					return a[0].localeCompare(b[0]);
				})
				.map(([fac, exams]) => ({ faculty: fac, exams }));
		})()
	);

	// --- Zeit-Helfer (Berlin) ---
	/** @param {string} iso → „13.07. 08:30" */
	const dateTime = (iso) => {
		const d = new Date(iso);
		return Number.isNaN(d.getTime())
			? ''
			: d.toLocaleString('de-DE', {
					timeZone: 'Europe/Berlin',
					day: '2-digit',
					month: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});
	};
	/** @param {string} iso → {date:'yyyy-mm-dd', time:'HH:MM'} in Berlin */
	function berlinParts(iso) {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return { date: '', time: '' };
		const s = new Intl.DateTimeFormat('sv-SE', {
			timeZone: 'Europe/Berlin',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(d);
		const [date, time] = s.replace(',', '').split(' ');
		return { date, time };
	}

	// --- Import ---
	let importing = $state(false);
	/** @type {any} */
	let importResult = $state(null);
	let importError = $state('');
	/** @param {Event} ev */
	async function onFile(ev) {
		const input = /** @type {HTMLInputElement} */ (ev.target);
		const file = input.files?.[0];
		if (!file) return;
		importing = true;
		importError = '';
		importResult = null;
		try {
			const csv = await file.text();
			const res = await fetch('/api/exam/importJointExams', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ csv })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				importError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			importResult = d.importJointExams;
			await invalidateAll();
		} catch (e) {
			importError = e instanceof Error ? e.message : String(e);
		} finally {
			importing = false;
			input.value = '';
		}
	}

	// --- externe Zeit setzen ---
	/** @type {any} */
	let timeFor = $state(null);
	let tDate = $state('');
	let tTime = $state('');
	let timeSaving = $state(false);
	let timeError = $state('');
	/** @param {any} e */
	function openTime(e) {
		timeFor = e;
		const p = e.planEntry?.starttime ? berlinParts(e.planEntry.starttime) : { date: '', time: '' };
		tDate = p.date;
		tTime = p.time;
		timeError = '';
	}
	/** @param {string} iso → „dd.mm.yyyy" */
	function toServerDate(iso) {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
		return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
	}
	async function saveTime() {
		if (!tDate || !tTime) {
			timeError = 'Datum und Zeit angeben.';
			return;
		}
		timeSaving = true;
		timeError = '';
		try {
			const res = await fetch('/api/exam/setExternalExamTime', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: timeFor.ancode, date: toServerDate(tDate), time: tTime })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				timeError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			timeFor = null;
			await invalidateAll();
		} catch (e) {
			timeError = e instanceof Error ? e.message : String(e);
		} finally {
			timeSaving = false;
		}
	}

	// --- ZPA-Verknüpfung: Status anzeigen / setzen / entfernen ---
	/** @type {Record<string, { label: string, cls: string, title: string }>} */
	const STATUS = {
		external: { label: 'extern', cls: 'badge-info', title: 'extern angelegt & verknüpft' },
		zpa: { label: 'ZPA', cls: 'badge-success', title: 'mit ZPA-Prüfung verknüpft' },
		unresolved: { label: 'ungeklärt', cls: 'badge-warning', title: 'FK07 — unklar, Aktion nötig' }
	};
	const jsonHeaders = { 'content-type': 'application/json' };

	/** @type {any} */
	let linkFor = $state(null);
	/** @type {any[]} */
	let candidates = $state([]);
	let candLoading = $state(false);
	let linking = $state(false);
	let linkError = $state('');

	/** @param {any} g */
	async function openLink(g) {
		linkFor = g;
		candidates = [];
		linkError = '';
		candLoading = true;
		try {
			const m = g.members[0];
			const res = await fetch('/api/exam/jointZpaCandidates', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ program: m.program, primussAncode: m.primussAncode })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) linkError = d?.error || `Fehler (HTTP ${res.status})`;
			else candidates = d.jointZpaCandidates ?? [];
		} catch (e) {
			linkError = e instanceof Error ? e.message : String(e);
		} finally {
			candLoading = false;
		}
	}
	const closeLink = () => (linkFor = null);

	/** Alle Mitglieder (Studiengänge) der Gruppe auf denselben ZPA-Ancode setzen.
	 * @param {number} zpaAncode */
	async function linkTo(zpaAncode) {
		if (!linkFor || linking) return;
		linking = true;
		linkError = '';
		try {
			for (const mem of linkFor.members) {
				const res = await fetch('/api/exam/setJointZpaLink', {
					method: 'POST',
					headers: jsonHeaders,
					body: JSON.stringify({
						program: mem.program,
						primussAncode: mem.primussAncode,
						zpaAncode
					})
				});
				const d = await res.json().catch(() => ({}));
				if (!res.ok || d?.error) {
					linkError = d?.error || `Fehler (HTTP ${res.status})`;
					return;
				}
			}
			closeLink();
			await invalidateAll();
		} catch (e) {
			linkError = e instanceof Error ? e.message : String(e);
		} finally {
			linking = false;
		}
	}

	async function unlinkAll() {
		if (!linkFor || linking) return;
		linking = true;
		linkError = '';
		try {
			for (const mem of linkFor.members) {
				const res = await fetch('/api/exam/removeJointLink', {
					method: 'POST',
					headers: jsonHeaders,
					body: JSON.stringify({ program: mem.program, primussAncode: mem.primussAncode })
				});
				const d = await res.json().catch(() => ({}));
				if (!res.ok || d?.error) {
					linkError = d?.error || `Fehler (HTTP ${res.status})`;
					return;
				}
			}
			closeLink();
			await invalidateAll();
		} catch (e) {
			linkError = e instanceof Error ? e.message : String(e);
		} finally {
			linking = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Prüfungen gemeinsamer Studiengänge</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.jointExams.length}</span>
		<div class="flex-1"></div>
		<label class="btn btn-outline btn-sm" class:btn-disabled={importing}>
			{importing ? 'importiert …' : 'CSV importieren'}
			<input
				type="file"
				accept=".csv,text/csv"
				class="hidden"
				onchange={onFile}
				disabled={importing}
			/>
		</label>
	</div>

	<details class="w-fit">
		<summary class="cursor-pointer text-sm text-base-content/60">
			💾 Verknüpfungen gemeinsamer Studiengänge sichern / wiederherstellen
		</summary>
		<div class="mt-2">
			<DatasetTransfer name="joint-links" title="Verknüpfungen gemeinsamer Studiengänge">
				Enthält die Verknüpfungen der gemeinsamen Studiengänge. Der Upload überschreibt die
				Verknüpfungen.
			</DatasetTransfer>
		</div>
	</details>

	{#if data.loadError}
		<div class="alert alert-error flex-col items-start py-2 text-sm">
			<span class="font-medium"
				>Prüfungen gemeinsamer Studiengänge konnten nicht geladen werden (Backend-Fehler).</span
			>
			<span class="font-mono text-xs break-words opacity-80">{data.loadError}</span>
		</div>
	{/if}

	{#if importError}
		<div class="alert alert-error py-2 text-sm"><span>{importError}</span></div>
	{/if}

	{#if data.jointExams.length === 0}
		<div class="text-sm text-base-content/50">
			Noch keine Prüfungen gemeinsamer Studiengänge — oben eine CSV importieren.
		</div>
	{:else}
		<!-- Filter + Sortierung -->
		<div
			class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-base-300 bg-base-100 p-3"
		>
			{#if faculties.length > 1}
				<div class="flex flex-wrap items-center gap-1">
					<span class="text-sm text-base-content/50">Studienfakultät:</span>
					<button
						class="badge gap-1 {faculty === '' ? 'badge-primary' : 'badge-ghost'}"
						onclick={() => (faculty = '')}>alle</button
					>
					{#each faculties as f}
						<button
							class="badge gap-1 {faculty === f ? 'badge-primary' : 'badge-ghost'}"
							onclick={() => (faculty = f)}>{f}</button
						>
					{/each}
				</div>
			{/if}
			<div class="flex flex-wrap items-center gap-1">
				<span class="text-sm text-base-content/50">Studiengang:</span>
				<button
					class="badge gap-1 {program === '' ? 'badge-primary' : 'badge-ghost'}"
					onclick={() => (program = '')}>alle</button
				>
				{#each programs as p}
					<button
						class="badge gap-1 {program === p ? 'badge-primary' : 'badge-ghost'}"
						onclick={() => (program = p)}>{p}</button
					>
				{/each}
			</div>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={fk07Only} />
				<span>nur FK07</span>
			</label>
			<input
				class="input input-bordered input-sm w-56"
				type="text"
				bind:value={q}
				placeholder="suchen: Prüfender, Modul, AnCode …"
			/>
			<div class="flex-1"></div>
			<div class="flex items-center gap-1 text-sm">
				<span class="text-base-content/50">Sortierung:</span>
				<button
					class="badge gap-1 {sortBy === 'ancode' ? 'badge-primary' : 'badge-ghost'}"
					onclick={() => (sortBy = 'ancode')}>Primuss-Ancode</button
				>
				<button
					class="badge gap-1 {sortBy === 'time' ? 'badge-primary' : 'badge-ghost'}"
					onclick={() => (sortBy = 'time')}>Zeit</button
				>
			</div>
		</div>

		<span class="text-xs text-base-content/40">{filtered.length} Prüfungen</span>

		{#each sections as section (section.faculty)}
			{#if faculties.length > 1}
				<div class="mt-2 flex items-center gap-2">
					<h2 class="text-lg font-semibold">{section.faculty}</h2>
					<span class="badge badge-ghost badge-sm tabular-nums">{section.exams.length}</span>
				</div>
			{/if}
			<div class="overflow-x-auto rounded-lg border border-base-300">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Primuss</th>
							<th>Modul</th>
							<th>Prüfender</th>
							<th>Art</th>
							<th>zuständig</th>
							<th>Status</th>
							<th>ZPA-Ancode</th>
							<th>Zeit</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each section.exams as g (g.ancode != null ? `a${g.ancode}` : `p${g.primussAncode}`)}
							<tr class="hover {g.plannedBy !== 'FK07' ? 'opacity-70' : ''}">
								<td class="font-mono tabular-nums">{g.primussList.join(', ')}</td>
								<td>
									<div class="font-medium">{g.module}</div>
									<div class="flex flex-wrap items-center gap-1">
										{#each g.programs as p}
											<span class="badge badge-ghost badge-xs">{p}</span>
										{/each}
										{#if g.isRepeaterExam}<span title="Wiederholung">🔁</span>{/if}
									</div>
								</td>
								<td class="text-sm">{g.mainExamer}</td>
								<td class="text-sm text-base-content/70">{g.examType}</td>
								<td>
									<span
										class="badge badge-sm {g.plannedBy === 'FK07' ? 'badge-info' : 'badge-ghost'}"
									>
										{g.plannedBy}
									</span>
								</td>
								<td>
									{#if STATUS[g.linkStatus]}
										<span
											class="badge badge-sm {STATUS[g.linkStatus].cls}"
											title={STATUS[g.linkStatus].title}
										>
											{STATUS[g.linkStatus].label}
										</span>
									{:else}
										<span class="text-base-content/30">—</span>
									{/if}
								</td>
								<td class="tabular-nums">
									{#if g.ancode != null}
										{g.ancode}
									{:else}
										<span class="badge badge-warning badge-sm">noch nicht angelegt</span>
									{/if}
								</td>
								<td class="text-sm tabular-nums">
									{#if g.planEntry?.starttime}
										{dateTime(g.planEntry.starttime)}
										{#if dNum(g.planEntry.starttime)}
											<span class="text-base-content/50"
												>({dNum(g.planEntry.starttime)}/{sNum(g.planEntry.starttime)})</span
											>
										{:else}
											<span
												class="text-base-content/50"
												title="Zeit außerhalb des Prüfungszeitraums">· außerhalb</span
											>
										{/if}
									{:else}
										<span class="text-base-content/30">—</span>
									{/if}
								</td>
								<td class="text-right whitespace-nowrap">
									{#if g.linkStatus === 'unresolved'}
										<WriteButton class="btn btn-warning btn-xs" onclick={() => openLink(g)}>
											Verknüpfen
										</WriteButton>
									{:else}
										<button
											class="btn btn-ghost btn-xs"
											title="ZPA-Verknüpfung ändern/entfernen"
											onclick={() => openLink(g)}
										>
											Verknüpfung
										</button>
									{/if}
									{#if g.plannedBy !== 'FK07' && g.ancode != null}
										<button class="btn btn-ghost btn-xs" onclick={() => openTime(g)}>
											Zeit setzen
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	{/if}
</div>

<!-- Import-Ergebnis-Toast -->
{#if importResult}
	<div class="toast toast-end z-50">
		<div class="alert alert-success flex-col items-start gap-1 shadow-lg">
			<div class="flex w-full items-center gap-2">
				<span class="font-medium">Import: {importResult.examsImported} Prüfungen</span>
				<div class="flex-1"></div>
				<button class="btn btn-ghost btn-xs" onclick={() => (importResult = null)}>schließen</button
				>
			</div>
			<div class="text-sm">
				{importResult.examsCreated} neu · {importResult.examsRemoved} entfernt · {importResult.examsExisting}
				unverändert · {importResult.examsSkippedFK07} FK07 verknüpft
			</div>
			{#if (importResult.programs ?? []).length}
				<div class="text-xs opacity-80">Studiengänge: {importResult.programs.join(', ')}</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Zeit setzen -->
{#if timeFor}
	<div class="modal modal-open">
		<div class="modal-box max-w-md">
			<h2 class="text-lg font-semibold">Zeit setzen — {timeFor.module}</h2>
			<p class="text-sm text-base-content/50">
				{timeFor.mainExamer} · Primuss {(timeFor.primussList ?? [timeFor.primussAncode]).join(', ')}
				· ZPA-Ancode
				{timeFor.ancode} · {(timeFor.programs ?? []).join(', ')} · zuständig {timeFor.plannedBy}
			</p>
			<div class="mt-3 flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Datum</span>
					<input type="date" class="input input-bordered input-sm" bind:value={tDate} />
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Zeit</span>
					<input type="time" class="input input-bordered input-sm" bind:value={tTime} />
				</label>
			</div>
			{#if timeError}
				<div class="alert alert-error mt-3 py-2 text-sm"><span>{timeError}</span></div>
			{/if}
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={() => (timeFor = null)} disabled={timeSaving}>
					Abbrechen
				</button>
				<WriteButton class="btn btn-primary btn-sm" onclick={saveTime} disabled={timeSaving}>
					{timeSaving ? 'speichert …' : 'Speichern'}
				</WriteButton>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={() => (timeFor = null)}></button>
	</div>
{/if}

<!-- ZPA-Verknüpfung -->
{#if linkFor}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h2 class="text-lg font-semibold">ZPA-Verknüpfung — {linkFor.module}</h2>
			<p class="text-sm text-base-content/50">
				{linkFor.mainExamer} · Primuss {linkFor.primussList.join(', ')} · {linkFor.programs.join(
					', '
				)} · Status {STATUS[linkFor.linkStatus]?.label ?? linkFor.linkStatus}
			</p>

			{#if linkFor.ancode != null}
				<div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
					<span>aktuell verknüpft mit ZPA-Ancode</span>
					<span class="font-mono tabular-nums">{linkFor.ancode}</span>
					<WriteButton
						class="btn btn-outline btn-error btn-xs"
						disabled={linking}
						onclick={unlinkAll}
					>
						Verknüpfung entfernen
					</WriteButton>
					<span class="text-xs text-base-content/50">(fällt auf Auto-Erkennung zurück)</span>
				</div>
			{/if}

			{#if linkError}
				<div class="alert alert-error mt-3 py-2 text-sm"><span>{linkError}</span></div>
			{/if}

			<div class="mt-3 text-xs font-medium text-base-content/60">Vorschläge</div>
			{#if candLoading}
				<div class="mt-2 flex items-center gap-2 text-sm text-base-content/60">
					<span class="loading loading-spinner loading-sm"></span> lädt Vorschläge …
				</div>
			{:else if candidates.length}
				<div class="mt-1 overflow-x-auto rounded-lg border border-base-300">
					<table class="table table-sm">
						<thead>
							<tr>
								<th>Ancode</th>
								<th>Modul</th>
								<th>Prüfender</th>
								<th>Art</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each candidates as c}
								<tr class="hover {c.ancode === linkFor.ancode ? 'bg-success/10' : ''}">
									<td class="font-mono tabular-nums">{c.ancode}</td>
									<td>{c.module}</td>
									<td class="text-sm">{c.mainExamer}</td>
									<td class="text-sm text-base-content/70">{c.examTypeFull}</td>
									<td class="text-right">
										<WriteButton
											class="btn btn-primary btn-xs"
											disabled={linking || c.ancode === linkFor.ancode}
											onclick={() => linkTo(c.ancode)}
										>
											{c.ancode === linkFor.ancode ? 'verknüpft' : 'verknüpfen'}
										</WriteButton>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="mt-2 text-sm text-base-content/50">Keine Vorschläge gefunden.</div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={closeLink} disabled={linking}
					>Schließen</button
				>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={closeLink}></button>
	</div>
{/if}
