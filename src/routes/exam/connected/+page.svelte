<script>
	import { run } from 'svelte/legacy';

	import { levelOf, zpaPrograms, primussPrograms } from '$lib/exam/connected.js';
	import ConnectedRow from '$lib/exam/ConnectedRow.svelte';

	let { data } = $props();

	// lokaler, bearbeitbarer State — Mutationen ersetzen nur den betroffenen
	// Eintrag (kein Voll-Reload).
	/** @type {any[]} */
	let exams = $state([]);
	/** @type {any} */
	let lastData = $state();
	run(() => {
		if (data.connectedExams !== lastData) {
			exams = [...(data.connectedExams ?? [])];
			lastData = data.connectedExams;
		}
	});

	/** @param {any} updated → aktualisiertes ConnectedExam einsetzen */
	function onUpdated(updated) {
		if (!updated) return;
		const i = exams.findIndex(
			(/** @type {any} */ e) => e.zpaExam.ancode === updated.zpaExam.ancode
		);
		if (i >= 0) exams[i] = updated;
		else exams = [...exams, updated];
		exams = exams;
	}

	let rows = $derived(exams.map((/** @type {any} */ e) => ({ ...e, level: levelOf(e) })));

	/** @param {(e: any) => Set<string>} fn */
	const sortedPrograms = (fn) =>
		[...new Set(rows.flatMap((/** @type {any} */ r) => [...fn(r)]))].sort((a, b) =>
			a.localeCompare(b)
		);
	// Studiengänge je Seite (eigene Optionslisten)
	let zpaProgramOptions = $derived(sortedPrograms(zpaPrograms));
	let primussProgramOptions = $derived(sortedPrograms(primussPrograms));

	let counts = $derived({
		total: rows.length,
		error: rows.filter((/** @type {any} */ r) => r.level === 'error').length,
		warning: rows.filter((/** @type {any} */ r) => r.level === 'warning').length,
		info: rows.filter((/** @type {any} */ r) => r.level === 'info').length,
		ok: rows.filter((/** @type {any} */ r) => r.level === 'ok').length
	});

	// Filter: null = alle, 'attention' = Warnungen+Fehler, sonst genau eine Stufe.
	/** @type {string | null} */
	let filter = $state(null);
	let zpaProgram = $state(''); // '' = alle (ZPA-Seite)
	let primussProgram = $state(''); // '' = alle (Primuss-Seite)
	let q = $state('');

	/** @param {string} f */
	const toggle = (f) => (filter = filter === f ? null : f);

	// `filter`, `zpaProgram`, `primussProgram` und `q` werden hier direkt
	// referenziert, damit Svelte die Reaktivität erkennt.
	let filtered = $derived(
		rows.filter((/** @type {any} */ r) => {
			if (filter === 'attention') {
				if (r.level !== 'warning' && r.level !== 'error') return false;
			} else if (filter && r.level !== filter) {
				return false;
			}
			if (zpaProgram && !zpaPrograms(r).has(zpaProgram)) return false;
			if (primussProgram && !primussPrograms(r).has(primussProgram)) return false;
			if (q.trim()) {
				const n = q.trim().toLowerCase();
				const hay =
					`${r.zpaExam.ancode} ${r.zpaExam.module} ${r.zpaExam.mainExamer} ` +
					(r.primussExams ?? [])
						.map((/** @type {any} */ p) => `${p.program} ${p.mainExamer}`)
						.join(' ');
				if (!hay.toLowerCase().includes(n)) return false;
			}
			return true;
		})
	);

	/** Badge ausgegraut, wenn ein anderer Filter aktiv ist.
	 * @param {string | null} active @param {string} f */
	const dim = (active, f) => (active && active !== f ? 'opacity-40' : '');
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Zuordnung ZPA ↔ Primuss</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{counts.total}</span>
		<span class="text-sm text-base-content/50">ZPA-Prüfungen</span>
	</div>

	{#if data.loadError}
		<div class="alert alert-error">
			<span>
				Die Zuordnung konnte nicht geladen werden (Backend-Fehler):
				<span class="font-mono text-xs">{data.loadError}</span>
			</span>
		</div>
	{:else}
		<!-- Übersicht: Badges sind Filter (anklicken = nur diese Stufe) -->
		<div
			class="flex flex-wrap items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-3"
		>
			<div class="flex flex-wrap items-center gap-1.5">
				<button
					class="badge badge-success gap-1 tabular-nums {dim(filter, 'ok')}"
					onclick={() => toggle('ok')}
				>
					✓ {counts.ok} passt
				</button>
				<button
					class="badge badge-ghost gap-1 tabular-nums {dim(filter, 'info')}"
					onclick={() => toggle('info')}
				>
					ℹ {counts.info} Hinweise
				</button>
				<button
					class="badge badge-warning gap-1 tabular-nums {dim(filter, 'warning')}"
					onclick={() => toggle('warning')}
				>
					⚠ {counts.warning} Warnungen
				</button>
				<button
					class="badge badge-error gap-1 tabular-nums {dim(filter, 'error')}"
					onclick={() => toggle('error')}
				>
					✕ {counts.error} Fehler
				</button>
			</div>
			<div class="flex-1"></div>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input
					type="checkbox"
					class="toggle toggle-sm"
					checked={filter === 'attention'}
					onchange={() => toggle('attention')}
				/>
				<span>nur Auffälligkeiten</span>
			</label>
			<label class="flex items-center gap-1 text-sm">
				<span class="text-base-content/50">ZPA</span>
				<select class="select select-bordered select-sm w-32" bind:value={zpaProgram}>
					<option value="">alle</option>
					{#each zpaProgramOptions as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
			</label>
			<label class="flex items-center gap-1 text-sm">
				<span class="text-base-content/50">Primuss</span>
				<select class="select select-bordered select-sm w-32" bind:value={primussProgram}>
					<option value="">alle</option>
					{#each primussProgramOptions as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
			</label>
			<input
				class="input input-bordered input-sm w-56"
				type="text"
				bind:value={q}
				placeholder="Ancode, Modul, Prüfender …"
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			{#each filtered as exam (exam.zpaExam.ancode)}
				<ConnectedRow {exam} primussByProgram={data.primussByProgram} onupdated={onUpdated} />
			{:else}
				<div class="p-6 text-center text-sm text-base-content/50">
					Keine Prüfungen entsprechen dem Filter.
				</div>
			{/each}
		</div>
	{/if}
</div>
