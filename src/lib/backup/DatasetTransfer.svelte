<!--
	Kleines wiederverwendbares Widget zum Sichern/Wiederherstellen genau eines
	Datensatzes (per REST direkt an plexams.go, nicht über GraphQL).

	  <DatasetTransfer name="external-exams" title="Externe Prüfungen">
	    Enthält die externen Prüfungen und ihre Zeiten. Der Upload überschreibt
	    nur diese Einträge, nicht den übrigen Plan.
	  </DatasetTransfer>

	Download läuft als einfacher Link (Server setzt Content-Disposition); Upload
	als Multipart-POST. Nach erfolgreichem Upload wird die Seite neu geladen
	(invalidateAll), es sei denn, ein eigenes `onsuccess` wird übergeben.
-->
<script>
	import { invalidateAll } from '$app/navigation';
	import WriteButton from '$lib/WriteButton.svelte';
	import { datasetDownloadUrl, uploadDataset } from '$lib/backup/transfer.js';

	/**
	 * @typedef {Object} Props
	 * @property {string} name Datensatz-Name (z. B. 'constraints')
	 * @property {string} [title] Überschrift; ohne Angabe wird `name` genutzt
	 * @property {() => void} [onsuccess] statt invalidateAll nach Erfolg
	 * @property {import('svelte').Snippet} [children] erläuternder Hinweistext
	 */

	/** @type {Props} */
	let { name, title = '', onsuccess, children } = $props();

	let fileInput = $state(/** @type {HTMLInputElement | undefined} */ (undefined));
	let file = $state(/** @type {File | null} */ (null));
	let busy = $state(false);
	let error = $state('');
	let done = $state(
		/** @type {{ restored?: Record<string, number>, total?: number } | null} */ (null)
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
		const r = await uploadDataset(name, file);
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

	let restoredEntries = $derived(Object.entries(done?.restored ?? {}));
</script>

<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
	<div class="flex items-center gap-2">
		<span class="font-semibold">Sichern / Wiederherstellen</span>
		<span class="badge badge-ghost badge-sm">{title || name}</span>
	</div>

	{#if children}
		<p class="text-sm text-base-content/60">{@render children()}</p>
	{/if}

	<div class="flex flex-wrap items-end gap-3">
		<a class="btn btn-outline btn-sm" href={datasetDownloadUrl(name)}>⬇️ Herunterladen (JSON)</a>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Datei wählen (JSON)</span>
			<input
				bind:this={fileInput}
				type="file"
				accept=".json,application/json"
				class="file-input file-input-bordered file-input-sm w-72"
				onchange={onpick}
			/>
		</label>

		<WriteButton class="btn btn-primary btn-sm" disabled={busy || !file} onclick={upload}>
			{busy ? 'lädt hoch …' : '⬆️ Hochladen'}
		</WriteButton>
	</div>

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}

	{#if done}
		<div class="alert alert-success py-2 text-sm">
			<span>
				Wiederhergestellt: {done.total ?? 0} Einträge{#if restoredEntries.length}
					({restoredEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}){/if}.
			</span>
		</div>
	{/if}
</div>
