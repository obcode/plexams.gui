<!--
	Kleines wiederverwendbares Widget zum Export/Import genau eines Datensatzes als
	CSV (per REST direkt an plexams.go, nicht über GraphQL).

	  <DatasetCsvTransfer name="constraints" title="Constraints">
	    Enthält alle Prüfungs-Constraints (inkl. notPlannedByMe).
	  </DatasetCsvTransfer>

	Download läuft als einfacher Link (Server setzt Content-Disposition); Upload
	als Multipart-POST. Der Import aktualisiert/ergänzt PRO ZEILE (kein Voll-Ersatz
	der Sammlung) — Ausnahme room-requests (fullReplace). Zeilengenaue Gründe für
	nicht übernommene Zeilen kommen in `skipped` und werden prominent angezeigt.
	Nach erfolgreichem Import wird die Seite neu geladen (invalidateAll), es sei
	denn, ein eigenes `onsuccess` wird übergeben.
-->
<script>
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';
	import { datasetCsvDownloadUrl, uploadDatasetCsv } from '$lib/backup/transfer.js';

	/**
	 * @typedef {Object} Props
	 * @property {string} name Datensatz-Name (z. B. 'constraints')
	 * @property {string} [title] Überschrift; ohne Angabe wird `name` genutzt
	 * @property {boolean} [fullReplace] Import ersetzt die ganze Sammlung (room-requests)
	 * @property {() => void} [onsuccess] statt invalidateAll nach Erfolg
	 * @property {import('svelte').Snippet} [children] erläuternder Hinweistext
	 */

	/** @type {Props} */
	let { name, title = '', fullReplace = false, onsuccess, children } = $props();

	let fileInput = $state(/** @type {HTMLInputElement | undefined} */ (undefined));
	let file = $state(/** @type {File | null} */ (null));
	let busy = $state(false);
	let error = $state('');
	let done = $state(
		/** @type {{ dataset?: string, applied?: number, skipped?: string[] } | null} */ (null)
	);

	function onpick() {
		file = fileInput?.files?.[0] ?? null;
		error = '';
		done = null;
	}

	async function upload() {
		if (busy || !file) return;
		busy = true;
		error = '';
		done = null;
		const r = await uploadDatasetCsv(name, file);
		busy = false;
		if (!r.ok) {
			const prefix =
				r.status === 409 ? 'Nicht möglich' : r.status === 400 ? 'Ungültige Datei' : 'Fehler';
			error = `${prefix}: ${r.error}`;
			return;
		}
		done = r.result;
		file = null;
		if (fileInput) fileInput.value = '';
		if (onsuccess) onsuccess();
		else await invalidateAll();
	}

	let skipped = $derived(done?.skipped ?? []);
</script>

<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
	<div class="flex items-center gap-2">
		<span class="font-semibold">CSV Export / Import</span>
		<span class="badge badge-ghost badge-sm">{title || name}</span>
		{#if fullReplace}<span class="badge badge-warning badge-sm">Voll-Ersatz</span>{/if}
	</div>

	{#if children}
		<p class="text-sm text-base-content/60">{@render children()}</p>
	{/if}
	<p class="text-xs text-base-content/50">
		{#if fullReplace}
			Der Import <strong>ersetzt die gesamte Sammlung</strong> (leere Datei wird abgelehnt).
		{:else}
			Der Import aktualisiert/ergänzt <strong>pro Zeile</strong> — die übrigen Einträge bleiben.
		{/if}
		Nach dem Import werden die Daten neu geladen.
	</p>

	<div class="flex flex-wrap items-end gap-3">
		<a class="btn btn-outline btn-sm" href={datasetCsvDownloadUrl(name)}>⬇️ Herunterladen (CSV)</a>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Datei wählen (CSV)</span>
			<input
				bind:this={fileInput}
				type="file"
				accept=".csv,text/csv"
				class="file-input file-input-bordered file-input-sm w-72"
				onchange={onpick}
			/>
		</label>

		<WriteButton class="btn btn-primary btn-sm" disabled={busy || !file} onclick={upload}>
			{busy ? 'importiert …' : '⬆️ Importieren'}
		</WriteButton>
	</div>

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}

	{#if done}
		<div class="alert alert-success py-2 text-sm">
			<span>{done.applied ?? 0} Zeile{(done.applied ?? 0) === 1 ? '' : 'n'} übernommen.</span>
		</div>
		{#if skipped.length}
			<div class="alert alert-warning flex-col items-start gap-1 py-2 text-sm">
				<span class="font-medium">
					{skipped.length} Zeile{skipped.length === 1 ? '' : 'n'} übersprungen:
				</span>
				<ul class="list-disc pl-5">
					{#each skipped as line}
						<li>{line}</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</div>
