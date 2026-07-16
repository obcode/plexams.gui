<script>
	import { invalidateAll } from '$app/navigation';
	import ExternalExamRow from '$lib/exam/ExternalExamRow.svelte';
	import DatasetTransfer from '$lib/backup/DatasetTransfer.svelte';
	import DatasetCsvTransfer from '$lib/backup/DatasetCsvTransfer.svelte';
	import { buildGroups, hasTime } from '$lib/exam/otherFkGroups';

	let { data } = $props();

	let onlyMissing = $state(false);
	/** @type {'all' | 'joint' | 'zpa'} */
	let source = $state('all');
	/** '' = alle FKs */
	let fkFilter = $state('');

	// alle vorkommenden FKs (für den Filter), sortiert
	let fks = $derived(
		[...new Set((data.items ?? []).map((/** @type {any} */ e) => e.fk || '—'))].sort()
	);

	// gefilterte + zu Zeilen aufbereitete Items, nach FK gruppiert
	// (Logik in $lib/exam/otherFkGroups, unit-getestet).
	let groups = $derived(buildGroups(data.items ?? [], { onlyMissing, source, fk: fkFilter }));

	// Gesamtzahlen für die Kopfzeile
	let total = $derived(
		(data.items ?? []).filter((/** @type {any} */ e) => source === 'all' || e.source === source)
			.length
	);
	let missing = $derived(
		(data.items ?? []).filter(
			(/** @type {any} */ e) => (source === 'all' || e.source === source) && !hasTime(e)
		).length
	);

	const onSaved = () => invalidateAll();
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-baseline gap-3">
		<h1 class="text-2xl font-semibold">Prüfungen anderer FKs</h1>
		<span class="text-sm text-base-content/60 tabular-nums">
			{total} Prüfungen{#if missing}, <span class="text-warning">{missing} ohne Termin</span>{/if}
		</span>
	</div>

	<details class="w-fit">
		<summary class="cursor-pointer text-sm text-base-content/60">
			💾 Externe Prüfungen sichern / wiederherstellen
		</summary>
		<div class="mt-2">
			<DatasetTransfer name="external-exams" title="Externe Prüfungen">
				Enthält die externen Prüfungen und ihre Zeiten. Der Upload überschreibt nur diese
				Einträge/Zeiten, nicht den übrigen Plan.
			</DatasetTransfer>
		</div>
	</details>

	<details class="w-fit">
		<summary class="cursor-pointer text-sm text-base-content/60">
			📄 CSV Export / Import (externe Prüfungen &amp; Zeiten)
		</summary>
		<div class="mt-2 flex flex-col gap-3">
			<DatasetCsvTransfer name="external-exams" title="Externe Prüfungen (Stammdaten)">
				Stammdaten der externen Prüfungen <strong>ohne Zeit</strong>.
			</DatasetCsvTransfer>
			<DatasetCsvTransfer name="exam-times" title="Prüfungszeiten">
				Absolutes Datum &amp; Uhrzeit der externen Prüfungen (inkl. gemeinsamer Studiengänge). Der
				Import berechnet den Slot neu.
			</DatasetCsvTransfer>
		</div>
	</details>

	<p class="max-w-3xl text-sm text-base-content/60">
		Termine für Prüfungen, die <strong>eine andere Fakultät</strong> plant: ZPA-Prüfungen mit dem Constraint
		„nicht von mir geplant" (FK aus dem Constraint-Feld) sowie von anderen FKs geplante Prüfungen gemeinsamer
		Studiengänge. Nach FK gruppiert. Datum &amp; Zeit direkt in der Zeile setzen — Prüfungen außerhalb
		des Prüfungszeitraums behalten nur die Zeit (keinen Slot).
	</p>

	{#if data.loadError}
		<div class="alert alert-error flex-col items-start py-2 text-sm">
			<span class="font-medium">Daten konnten nicht geladen werden (Backend-Fehler).</span>
			<span class="font-mono text-xs break-words opacity-80">{data.loadError}</span>
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-3">
		<!-- Quelle -->
		<div role="tablist" class="tabs tabs-boxed">
			<button
				role="tab"
				class="tab {source === 'all' ? 'tab-active' : ''}"
				onclick={() => (source = 'all')}
			>
				alle Quellen
			</button>
			<button
				role="tab"
				class="tab {source === 'zpa' ? 'tab-active' : ''}"
				onclick={() => (source = 'zpa')}
			>
				ZPA (nicht von mir)
			</button>
			<button
				role="tab"
				class="tab {source === 'joint' ? 'tab-active' : ''}"
				onclick={() => (source = 'joint')}
			>
				Gemeinsame Studiengänge
			</button>
		</div>

		<!-- FK-Filter -->
		<label class="flex items-center gap-2 text-sm">
			<span class="text-base-content/60">FK</span>
			<select class="select select-bordered select-sm" bind:value={fkFilter}>
				<option value="">alle</option>
				{#each fks as fk}
					<option value={fk}>{fk}</option>
				{/each}
			</select>
		</label>

		<label class="flex cursor-pointer items-center gap-2 text-sm">
			<input type="checkbox" class="toggle toggle-sm" bind:checked={onlyMissing} />
			<span>nur ohne Termin</span>
		</label>
	</div>

	{#if !groups.length}
		<div class="text-sm text-base-content/50">
			{onlyMissing
				? 'Alle passenden Prüfungen haben einen Termin.'
				: 'Keine Prüfungen anderer FKs.'}
		</div>
	{:else}
		{#each groups as group}
			<div class="flex flex-col gap-1">
				<div class="flex items-center gap-2">
					<h2 class="text-lg font-semibold">{group.fk}</h2>
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
							{#each group.exams as exam (exam.sourceLabel + '-' + exam.ancode)}
								<ExternalExamRow {exam} days={data.days} onsaved={onSaved} />
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/each}
	{/if}

	<!-- Scroll-Puffer: das native Datums-Popup öffnet nach unten und würde in den
	     untersten Zeilen am Bildschirmrand abgeschnitten. -->
	<div class="h-96" aria-hidden="true"></div>
</div>
