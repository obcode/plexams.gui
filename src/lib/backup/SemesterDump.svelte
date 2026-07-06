<!--
	Globaler Bereich „Gesamtes Semester sichern/wiederherstellen" (REST an
	plexams.go). Download = ZIP-Dump des kompletten Semesters; Restore = ZIP in
	eine FRISCHE Workspace-DB einspielen.

	Der Server blockt den Restore mit 409, wenn die Ziel-DB nicht leer oder
	read-only ist (Fehlertext nennt die blockierende Collection). semester_meta
	bleibt bewusst unangetastet, damit die Ziel-DB ihre Identität/read-only-
	Kennung behält. Nach Erfolg werden alle Daten neu geladen (voller Reload,
	wie nach einem Semesterwechsel).
-->
<script>
	import WriteButton from '$lib/WriteButton.svelte';
	import { semesterDumpDownloadUrl, restoreSemesterDump } from '$lib/backup/transfer.js';

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

	async function restore() {
		if (busy || !file) return;
		busy = true;
		error = '';
		done = null;
		const r = await restoreSemesterDump(file);
		busy = false;
		if (!r.ok) {
			const prefix =
				r.status === 409
					? 'Nicht möglich (DB nicht leer oder geschützt)'
					: r.status === 400
						? 'Ungültige ZIP'
						: 'Fehler';
			error = `${prefix}: ${r.error}`;
			return;
		}
		done = r.result;
		file = null;
		if (fileInput) fileInput.value = '';
	}

	function reloadAll() {
		window.location.reload();
	}

	let restoredEntries = $derived(Object.entries(done?.restored ?? {}));
</script>

<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
	<div class="flex items-center gap-2">
		<span class="font-semibold">Gesamtes Semester sichern / wiederherstellen</span>
	</div>
	<p class="text-sm text-base-content/60">
		Der Download enthält den kompletten Semesterstand als ZIP. Der Restore spielt eine solche ZIP in
		eine <strong>frische, leere Workspace-DB</strong> ein — bitte vorher ein neues Semester anlegen bzw.
		dorthin wechseln. Die Semester-Identität der Ziel-DB (inkl. Schutz-Kennung) bleibt erhalten.
	</p>

	<div class="flex flex-wrap items-end gap-3">
		<a class="btn btn-outline btn-sm" href={semesterDumpDownloadUrl()}>
			⬇️ Gesamtes Semester herunterladen
		</a>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Dump wählen (ZIP)</span>
			<input
				bind:this={fileInput}
				type="file"
				accept=".zip,application/zip"
				class="file-input file-input-bordered file-input-sm w-72"
				onchange={onpick}
			/>
		</label>

		<WriteButton class="btn btn-primary btn-sm" disabled={busy || !file} onclick={restore}>
			{busy ? 'stellt wieder her …' : '⬆️ Semester wiederherstellen'}
		</WriteButton>
	</div>

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}

	{#if done}
		<div class="alert alert-success flex-col items-start gap-2 py-2 text-sm">
			<span>
				Wiederhergestellt: {done.total ?? 0} Einträge{#if restoredEntries.length}
					({restoredEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}){/if}.
			</span>
			<button class="btn btn-sm" onclick={reloadAll}>🔄 Alle Daten neu laden</button>
		</div>
	{/if}
</div>
