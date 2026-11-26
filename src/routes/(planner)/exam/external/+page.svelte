<script>
	import { refreshAll } from '$app/navigation';
	import ExternalExamRow from '#lib/exam/ExternalExamRow.svelte';
	import DatasetCsvTransfer from '#lib/backup/DatasetCsvTransfer.svelte';
	import { buildGroups, hasTime } from '#lib/exam/otherFkGroups.ts';
	import PageIntro from '#lib/help/PageIntro.svelte';
	import Term from '#lib/help/Term.svelte';

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
	// (Logik in #lib/exam/otherFkGroups, unit-getestet).
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

	const onSaved = () => refreshAll();
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<PageIntro title="Prüfungen anderer FKs" count={total} help="schritt-otherFKExamsScheduled">
		Hier stehen Prüfungen, die eine andere <Term id="fk">Fakultät</Term> plant, die aber auch unsere Studierenden
		schreiben: Prüfungen, die unter „Prüfungen auswählen &amp; Vorgaben“ die Vorgabe „nicht von mir geplant“
		haben, und die Prüfungen der
		<Term id="gemeinsame-studiengaenge">gemeinsamen Studiengänge</Term>, die die andere Fakultät
		plant. Trag hier die Termine ein, die die andere Fakultät festgelegt hat, und zwar vor dem
		Generieren des Terminplans: Für uns sind sie fest, und der Generator plant unsere Prüfungen um
		sie herum.
		{#snippet howto()}
			<ol>
				<li>Mit „nur ohne Termin“ die Prüfungen zeigen, denen noch ein Termin fehlt.</li>
				<li>
					In der Zeile Datum und Uhrzeit wählen und „setzen“ (bzw. „ändern“) drücken. Ein Termin
					außerhalb unseres Prüfungszeitraums ist erlaubt und wird entsprechend markiert.
				</li>
				<li>
					Viele Termine auf einmal: unter „Als CSV exportieren / importieren“ die Prüfungszeiten
					exportieren, ergänzen und wieder importieren.
				</li>
			</ol>
		{/snippet}
	</PageIntro>
	{#if missing}
		<p class="text-sm text-warning">
			{missing === 1 ? 'Eine Prüfung hat' : `${missing} Prüfungen haben`} noch keinen Termin.
		</p>
	{/if}

	<details class="w-fit">
		<summary class="cursor-pointer text-sm text-base-content/60">
			📄 Als CSV exportieren / importieren
		</summary>
		<div class="mt-2 flex flex-col gap-3">
			<DatasetCsvTransfer name="external-exams" title="Prüfungen anderer FKs (ohne Termine)">
				Modul, Prüfende und Art der Prüfungen anderer Fakultäten, <strong>ohne Termin</strong>.
			</DatasetCsvTransfer>
			<DatasetCsvTransfer name="exam-times" title="Prüfungszeiten">
				Datum und Uhrzeit dieser Prüfungen, auch der gemeinsamen Studiengänge. Der Import setzt für
				jede Zeile den Termin der Prüfung mit diesem Ancode; Zeilen ohne Datum oder Uhrzeit werden
				übersprungen.
			</DatasetCsvTransfer>
		</div>
	</details>

	{#if data.loadError}
		<div class="alert alert-error flex-col items-start py-2 text-sm">
			<span class="font-medium">Die Prüfungen konnten nicht geladen werden.</span>
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
				ZPA, „nicht von mir geplant“
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
			<span class="text-base-content/60">Fakultät</span>
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
				: 'Keine Prüfungen anderer FKs. Sie erscheinen hier, sobald eine Prüfung die Vorgabe „nicht von mir geplant“ hat oder ein gemeinsamer Studiengang importiert ist.'}
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
