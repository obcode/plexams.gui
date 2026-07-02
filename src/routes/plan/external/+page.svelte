<script>
	import { invalidateAll } from '$app/navigation';
	import ExternalExamRow from '$lib/exam/ExternalExamRow.svelte';

	export let data;

	/** @type {'mucdai' | 'zpa'} */
	let tab = 'mucdai';
	let onlyMissing = false;

	/** @param {any} e */
	const hasTime = (e) => !!e.planEntry?.externalTime;

	// MUC.DAI (extern) nach Studiengang gruppiert; eine Prüfung in mehreren
	// Studiengängen erscheint in jedem — genau die gewünschte Übersicht.
	$: mucByProgram = (() => {
		/** @type {Map<string, any[]>} */
		const m = new Map();
		for (const e of data.mucdai ?? []) {
			if (onlyMissing && hasTime(e)) continue;
			const row = {
				ancode: e.ancode,
				primussAncode: e.primussAncode,
				module: e.module,
				mainExamer: e.mainExamer,
				examType: e.examType,
				isRepeaterExam: e.isRepeaterExam,
				fkLabel: e.plannedBy,
				extra: [],
				planEntry: e.planEntry
			};
			if (!m.has(e.program)) m.set(e.program, []);
			m.get(e.program)?.push(row);
		}
		return [...m.entries()]
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([program, exams]) => ({
				program,
				exams: exams.sort((x, y) => (x.ancode ?? 0) - (y.ancode ?? 0))
			}));
	})();

	$: zpaRows = (data.zpa ?? [])
		.filter((/** @type {any} */ e) => !onlyMissing || !hasTime(e))
		.map((/** @type {any} */ e) => ({
			ancode: e.ancode,
			module: e.module,
			mainExamer: e.mainExamer,
			examType: e.examType,
			isRepeaterExam: false,
			fkLabel: e.fk,
			extra: e.groups ?? [],
			planEntry: e.planEntry
		}))
		.sort((/** @type {any} */ a, /** @type {any} */ b) => (a.ancode ?? 0) - (b.ancode ?? 0));

	// „noch kein Termin"-Zähler (distinkte Ancodes bei MUC.DAI)
	$: mucMissing = new Set(
		(data.mucdai ?? []).filter((/** @type {any} */ e) => !hasTime(e)).map((/** @type {any} */ e) => e.ancode)
	).size;
	$: zpaMissing = (data.zpa ?? []).filter((/** @type {any} */ e) => !hasTime(e)).length;

	const onSaved = () => invalidateAll();
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Externe Prüfungstermine</h1>
	</div>
	<p class="max-w-3xl text-sm text-base-content/60">
		Termine für Prüfungen, die <strong>nicht du</strong> planst: von anderen Fakultäten geplante
		MUC.DAI-Prüfungen sowie ZPA-Prüfungen mit dem Constraint „nicht von mir geplant". Datum &amp;
		Zeit direkt in der Zeile setzen bzw. ändern.
	</p>

	{#if data.loadError}
		<div class="alert alert-error flex-col items-start py-2 text-sm">
			<span class="font-medium">Daten konnten nicht geladen werden (Backend-Fehler).</span>
			<span class="font-mono text-xs break-words opacity-80">{data.loadError}</span>
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-3">
		<div role="tablist" class="tabs tabs-boxed">
			<button
				role="tab"
				class="tab {tab === 'mucdai' ? 'tab-active' : ''}"
				on:click={() => (tab = 'mucdai')}
			>
				MUC.DAI (extern)
				<span class="badge badge-sm ml-2 tabular-nums">{(data.mucdai ?? []).length}</span>
				{#if mucMissing}<span class="badge badge-warning badge-sm ml-1 tabular-nums">{mucMissing} offen</span>{/if}
			</button>
			<button
				role="tab"
				class="tab {tab === 'zpa' ? 'tab-active' : ''}"
				on:click={() => (tab = 'zpa')}
			>
				ZPA (nicht von mir geplant)
				<span class="badge badge-sm ml-2 tabular-nums">{(data.zpa ?? []).length}</span>
				{#if zpaMissing}<span class="badge badge-warning badge-sm ml-1 tabular-nums">{zpaMissing} offen</span>{/if}
			</button>
		</div>
		<label class="flex cursor-pointer items-center gap-2 text-sm">
			<input type="checkbox" class="toggle toggle-sm" bind:checked={onlyMissing} />
			<span>nur ohne Termin</span>
		</label>
	</div>

	{#if tab === 'mucdai'}
		{#if !mucByProgram.length}
			<div class="text-sm text-base-content/50">
				{onlyMissing
					? 'Alle externen MUC.DAI-Prüfungen haben einen Termin.'
					: 'Keine von anderen FKs geplanten MUC.DAI-Prüfungen.'}
			</div>
		{:else}
			{#each mucByProgram as group}
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<h2 class="text-lg font-semibold">{group.program}</h2>
						<span class="badge badge-ghost badge-sm tabular-nums">{group.exams.length}</span>
					</div>
					<div class="overflow-x-auto rounded-lg border border-base-300">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Ancode</th>
									<th>Modul</th>
									<th>Prüfende:r</th>
									<th>Art</th>
									<th>Termin</th>
								</tr>
							</thead>
							<tbody>
								{#each group.exams as exam (exam.ancode)}
									<ExternalExamRow {exam} on:saved={onSaved} />
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
		{/if}
	{:else if !zpaRows.length}
		<div class="text-sm text-base-content/50">
			{onlyMissing
				? 'Alle Prüfungen mit „nicht von mir geplant" haben einen Termin.'
				: 'Keine ZPA-Prüfungen mit „nicht von mir geplant".'}
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Ancode</th>
						<th>Modul</th>
						<th>Prüfende:r</th>
						<th>Art</th>
						<th>Termin</th>
					</tr>
				</thead>
				<tbody>
					{#each zpaRows as exam (exam.ancode)}
						<ExternalExamRow {exam} on:saved={onSaved} />
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
