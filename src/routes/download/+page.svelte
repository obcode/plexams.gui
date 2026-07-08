<script>
	import {
		pdfDownloadUrl,
		csvDownloadUrl,
		icsDownloadUrl,
		PDF_DOWNLOADS,
		CSV_DOWNLOADS
	} from '$lib/download/downloads.js';

	let { data } = $props();

	/** @type {string[]} */
	let programs = $derived(data.programs ?? []);

	// Gemeinsame Studiengang-Auswahl für Entwurf-CSV und ICS-Kalender.
	let program = $state('');

	let listPdfs = $derived(PDF_DOWNLOADS.filter((d) => d.group === 'list'));
	let draftPdfs = $derived(PDF_DOWNLOADS.filter((d) => d.group === 'draft'));
	let plainCsvs = $derived(CSV_DOWNLOADS.filter((d) => !d.needsProgram));
	let draftCsv = $derived(CSV_DOWNLOADS.find((d) => d.needsProgram));
</script>

<div class="mx-2 mt-4 flex max-w-4xl flex-col gap-6">
	<div>
		<h1 class="text-2xl font-bold">Downloads &amp; Exporte</h1>
		<p class="mt-1 text-sm text-base-content/60">
			PDF-, CSV- und Kalender-Exporte direkt vom plexams-Server. Bei fehlenden Daten antwortet der
			Server mit einer Klartext-Fehlermeldung.
		</p>
	</div>

	<!-- Listen (PDF) -->
	<section class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/70">Listen (PDF)</h2>
		<div class="flex flex-wrap gap-2">
			{#each listPdfs as d (d.kind)}
				<a class="btn btn-sm btn-outline" href={pdfDownloadUrl(d.kind)}>⬇️ {d.label}</a>
			{/each}
		</div>
	</section>

	<!-- Entwürfe (PDF) -->
	<section class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/70">Plan-Entwürfe (PDF)</h2>
		<div class="flex flex-wrap gap-2">
			{#each draftPdfs as d (d.kind)}
				<a class="btn btn-sm btn-outline" href={pdfDownloadUrl(d.kind)}>
					⬇️ {d.label}
					{#if d.format === 'zip'}<span class="badge badge-ghost badge-xs ml-1">ZIP</span>{/if}
				</a>
			{/each}
		</div>
	</section>

	<!-- Entwürfe (CSV) -->
	<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/70">Exporte (CSV)</h2>
		<div class="flex flex-wrap gap-2">
			{#each plainCsvs as d (d.kind)}
				<a class="btn btn-sm btn-outline" href={csvDownloadUrl(d.kind)}>⬇️ {d.label}</a>
			{/each}
		</div>
		{#if draftCsv}
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-sm text-base-content/70">{draftCsv.label}:</span>
				<select class="select select-bordered select-sm" bind:value={program}>
					<option value="">Studiengang wählen…</option>
					{#each programs as p (p)}
						<option value={p}>{p}</option>
					{/each}
				</select>
				<a
					class="btn btn-sm btn-outline"
					class:btn-disabled={!program}
					href={program ? csvDownloadUrl(draftCsv.kind, program) : undefined}
				>
					⬇️ CSV
				</a>
			</div>
		{/if}
	</section>

	<!-- Kalender (ICS) -->
	<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/70">Kalender (ICS)</h2>
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm text-base-content/70">Kalender pro Studiengang:</span>
			<select class="select select-bordered select-sm" bind:value={program}>
				<option value="">Studiengang wählen…</option>
				{#each programs as p (p)}
					<option value={p}>{p}</option>
				{/each}
			</select>
			<a
				class="btn btn-sm btn-outline"
				class:btn-disabled={!program}
				href={program ? icsDownloadUrl(program) : undefined}
			>
				⬇️ Kalender (.ics)
			</a>
		</div>
		{#if !programs.length}
			<p class="text-xs text-base-content/40">Keine aktiven Studiengänge gefunden.</p>
		{/if}
	</section>
</div>
