<script>
	import { onMount } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	import {
		listAttachments,
		clearAttachments,
		uploadAttachmentsZip,
		uploadAttachment
	} from '$lib/email/attachments';

	// Wiederverwendbare Verwaltung des E-Mail-Anhang-Speichers für EINE Art
	// (kind). Zeigt Anzahl + Liste, erlaubt ZIP-Upload und Leeren und gleicht
	// optional gegen erwartete keys ab (z. B. fehlende Lehrer-IDs).

	/**
	 * @typedef {Object} Props
	 * @property {string} kind - 'cover-page' | 'invigilation-image'
	 * @property {string} title - Überschrift
	 * @property {string} [description] - kurze Beschreibung
	 * @property {string} [unitPlural] - Bezeichnung der Einheit, Plural (für Texte), z. B. 'Deckblätter'
	 * @property {boolean} [acceptZip] - ZIP-Upload anbieten (für cover-page)
	 * @property {boolean} [acceptSingle] - Einzeldatei-Upload („nachreichen") anbieten
	 * @property {string} [singleAccept] - accept-Attribut des Einzeldatei-Inputs, z. B. '.pdf'
	 * @property {{ key: string | number, label: string }[]} [expectedKeys] - optional: erwartete keys für Abgleich, [{ key, label }]
	 * @property {import('svelte').Snippet} [actions]
	 * @property {(attachments: import('$lib/email/attachments').Attachment[]) => void} [onchange] - meldet den Anhang-Stand nach oben
	 */

	/** @type {Props} */
	let {
		kind,
		title,
		description = '',
		unitPlural = 'Anhänge',
		acceptZip = false,
		acceptSingle = false,
		singleAccept = '',
		expectedKeys = [],
		actions,
		onchange
	} = $props();

	/** @type {import('$lib/email/attachments').Attachment[]} */
	let attachments = $state([]);
	let loading = $state(true);
	/** @type {string | null} */
	let loadError = $state(null);

	let uploading = $state(false);
	/** @type {{ stored: number, skipped: string[] } | null} */
	let uploadResult = $state(null);
	let uploadBlocked = $state(false);
	/** @type {string | null} */
	let uploadError = $state(null);

	let confirming = $state(false);
	let clearing = $state(false);

	// Einzeldatei nachreichen
	/** gewählter key (leer = aus Dateiname ableiten) */
	let singleKey = $state('');
	let singleUploading = $state(false);
	/** @type {{ filename: string, key: string } | null} */
	let singleResult = $state(null);
	let singleBlocked = $state(false);
	/** @type {string | null} */
	let singleError = $state(null);

	/** @type {HTMLInputElement | undefined} */
	let fileInput = $state();
	/** @type {HTMLInputElement | undefined} */
	let singleInput = $state();

	// meldet den aktuellen Anhang-Stand nach oben (nach Laden/Upload/Leeren)

	async function load() {
		loading = true;
		loadError = null;
		try {
			attachments = await listAttachments(kind);
			onchange?.(attachments);
		} catch (e) {
			loadError = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	/** @param {Event} e */
	async function onZipSelected(e) {
		const input = /** @type {HTMLInputElement} */ (e.target);
		const file = input.files && input.files[0];
		if (!file) return;
		uploading = true;
		uploadResult = null;
		uploadBlocked = false;
		uploadError = null;
		const res = await uploadAttachmentsZip({ kind, file });
		uploading = false;
		// Auswahl zurücksetzen, damit dieselbe Datei erneut gewählt werden kann
		input.value = '';
		if (res.blocked) {
			uploadBlocked = true;
			return;
		}
		if (!res.ok) {
			uploadError = res.error ?? 'Upload fehlgeschlagen';
			return;
		}
		uploadResult = { stored: res.result?.stored ?? 0, skipped: res.result?.skipped ?? [] };
		await load();
	}

	/** @param {Event} e */
	async function onSingleSelected(e) {
		const input = /** @type {HTMLInputElement} */ (e.target);
		const file = input.files && input.files[0];
		if (!file) return;
		singleUploading = true;
		singleResult = null;
		singleBlocked = false;
		singleError = null;
		const res = await uploadAttachment({
			kind,
			key: singleKey || undefined,
			blob: file,
			filename: file.name
		});
		singleUploading = false;
		input.value = '';
		if (res.blocked) {
			singleBlocked = true;
			return;
		}
		if (!res.ok) {
			// u. a. HTTP 400, wenn der Server keinen key aus dem Namen ableiten kann
			singleError = res.error ?? 'Upload fehlgeschlagen';
			return;
		}
		singleResult = {
			filename: res.result?.filename ?? file.name,
			key: String(res.result?.key ?? singleKey)
		};
		await load();
	}

	async function doClear() {
		confirming = false;
		clearing = true;
		uploadResult = null;
		uploadError = null;
		try {
			await clearAttachments(kind);
			await load();
		} catch (e) {
			loadError = e instanceof Error ? e.message : String(e);
		} finally {
			clearing = false;
		}
	}

	/** @param {number} n */
	const fmtSize = (n) => {
		if (n == null) return '';
		if (n < 1024) return `${n} B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
		return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	};

	let uploadedKeys = $derived(new Set(attachments.map((a) => String(a.key))));
	let missing = $derived(expectedKeys.filter((e) => !uploadedKeys.has(String(e.key))));
</script>

<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
	<!-- Kopf -->
	<div class="flex flex-wrap items-start justify-between gap-2">
		<div class="min-w-0">
			<div class="font-medium">{title}</div>
			{#if description}
				<div class="text-xs text-base-content/50">{description}</div>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if loading}
				<span class="badge badge-ghost gap-2">
					<span class="loading loading-spinner loading-xs"></span> lädt …
				</span>
			{:else}
				<span class="badge {attachments.length ? 'badge-success' : 'badge-ghost'} tabular-nums">
					{attachments.length}
					{unitPlural}
				</span>
			{/if}
		</div>
	</div>

	{#if loadError}
		<div class="alert alert-error py-2 text-sm"><span>{loadError}</span></div>
	{/if}

	<!-- Abgleich gegen erwartete keys -->
	{#if expectedKeys.length}
		<div
			class="rounded-lg border px-3 py-2 text-sm {missing.length
				? 'border-warning/40 bg-warning/5'
				: 'border-success/40 bg-success/5'}"
		>
			<div class="font-medium">
				{expectedKeys.length - missing.length} von {expectedKeys.length} vorhanden
				{#if !missing.length}
					<span class="text-success">— vollständig ✓</span>
				{/if}
			</div>
			{#if missing.length}
				<div class="mt-1 text-xs text-base-content/60">Fehlend ({missing.length}):</div>
				<div class="mt-1 flex flex-wrap gap-1">
					{#each missing as m}
						<span class="badge badge-outline badge-warning badge-sm">{m.label}</span>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Aktionen -->
	<div class="flex flex-wrap items-center gap-2">
		{#if acceptZip}
			<button
				class="btn btn-primary btn-sm gap-2"
				disabled={uploading}
				onclick={() => fileInput?.click()}
			>
				{#if uploading}
					<span class="loading loading-spinner loading-xs"></span>
				{/if}
				⬆ ZIP hochladen
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept=".zip"
				class="hidden"
				onchange={onZipSelected}
			/>
		{/if}

		<!-- zusätzliche, kind-spezifische Aktion (z. B. Link zur Erzeugung) -->
		{@render actions?.()}

		<button class="btn btn-ghost btn-sm" onclick={load} disabled={loading}>↻ Aktualisieren</button>

		<div class="flex-1"></div>

		{#if confirming}
			<div class="flex items-center gap-2 rounded-lg bg-error/10 px-2 py-1" transition:slide>
				<span class="text-xs font-medium text-error">Wirklich alle {unitPlural} löschen?</span>
				<button class="btn btn-error btn-xs" disabled={clearing} onclick={doClear}>Ja</button>
				<button class="btn btn-ghost btn-xs" onclick={() => (confirming = false)}>Abbrechen</button>
			</div>
		{:else}
			<button
				class="btn btn-outline btn-error btn-sm"
				disabled={clearing || !attachments.length}
				onclick={() => (confirming = true)}
			>
				🗑 Anhänge leeren
			</button>
		{/if}
	</div>

	<!-- Einzeldatei nachreichen -->
	{#if acceptSingle}
		<div
			class="flex flex-wrap items-end gap-3 rounded-lg border border-base-300 bg-base-200/40 p-3"
		>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Einzelne Datei nachreichen</span>
				<select class="select select-bordered select-sm w-72" bind:value={singleKey}>
					<option value="">key aus Dateiname ableiten</option>
					{#each expectedKeys as k (k.key)}
						<option value={k.key}>{k.label} ({k.key})</option>
					{/each}
				</select>
			</label>
			<button
				class="btn btn-primary btn-sm gap-2"
				disabled={singleUploading}
				onclick={() => singleInput?.click()}
			>
				{#if singleUploading}
					<span class="loading loading-spinner loading-xs"></span>
				{/if}
				⬆ Datei wählen & hochladen
			</button>
			<input
				bind:this={singleInput}
				type="file"
				accept={singleAccept}
				class="hidden"
				onchange={onSingleSelected}
			/>
		</div>
		{#if singleBlocked}
			<div class="alert alert-warning py-2 text-sm" transition:fade>
				<span>
					Upload momentan nicht möglich: Es läuft gerade eine Validierung oder ein anderer
					Transfer/E-Mail-Versand. Bitte später erneut versuchen.
				</span>
			</div>
		{/if}
		{#if singleError}
			<div class="alert alert-error py-2 text-sm" transition:fade><span>{singleError}</span></div>
		{/if}
		{#if singleResult}
			<div class="alert alert-success py-2 text-sm" transition:fade>
				<span>Gespeichert: {singleResult.filename} (key {singleResult.key}).</span>
			</div>
		{/if}
	{/if}

	<!-- Upload-Rückmeldung -->
	{#if uploadBlocked}
		<div class="alert alert-warning py-2 text-sm" transition:fade>
			<span>
				Upload momentan nicht möglich: Es läuft gerade eine Validierung oder ein anderer
				Transfer/E-Mail-Versand. Bitte später erneut versuchen.
			</span>
		</div>
	{/if}
	{#if uploadError}
		<div class="alert alert-error py-2 text-sm" transition:fade><span>{uploadError}</span></div>
	{/if}
	{#if uploadResult}
		<div
			class="alert {uploadResult.skipped.length ? 'alert-warning' : 'alert-success'} py-2 text-sm"
			transition:fade
		>
			<div>
				<div>{uploadResult.stored} Datei(en) gespeichert.</div>
				{#if uploadResult.skipped.length}
					<div class="mt-1 text-xs">
						Übersprungen (keine Ziffern im Namen → kein key ableitbar):
						<span class="font-mono">{uploadResult.skipped.join(', ')}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Liste -->
	{#if attachments.length}
		<div class="max-h-72 overflow-auto rounded-lg border border-base-300">
			<table class="table table-zebra table-xs">
				<thead>
					<tr>
						<th>key</th>
						<th>Datei</th>
						<th class="text-right">Größe</th>
						<th>hochgeladen</th>
					</tr>
				</thead>
				<tbody>
					{#each attachments as a}
						<tr>
							<td class="tabular-nums">{a.key}</td>
							<td class="break-all">{a.filename}</td>
							<td class="text-right tabular-nums">{fmtSize(a.size)}</td>
							<td class="whitespace-nowrap text-base-content/60">{a.uploadedAt}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else if !loading}
		<div class="text-sm text-base-content/50">Noch keine {unitPlural} hochgeladen.</div>
	{/if}
</div>
