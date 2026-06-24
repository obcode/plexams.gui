<script>
	import ValidationGroup from '$lib/validation/ValidationGroup.svelte';
	import StreamAction from '$lib/zpa/StreamAction.svelte';
	import SyncLog from '$lib/zpa/SyncLog.svelte';
	import { zpaValidators } from '$lib/validation/validators';
	import { invalidateAll } from '$app/navigation';

	export let data;

	// nach einem Im-/Export den Sync-Verlauf neu laden
	const refreshLog = () => invalidateAll();

	// Downloads (Import aus ZPA) — ohne Argumente.
	/** @type {{ field: string, title: string, desc: string }[]} */
	const downloads = [
		{
			field: 'importExamsFromZPA',
			title: 'Prüfungen',
			desc: 'Prüfungen aus dem ZPA holen und cachen'
		},
		{
			field: 'importTeachersFromZPA',
			title: 'Dozierende',
			desc: 'Dozierende aus dem ZPA holen und cachen'
		},
		{
			field: 'importInvigilatorRequirementsFromZPA',
			title: 'Aufsichts-Anforderungen',
			desc: 'Aufsichts-Anforderungen aus dem ZPA holen und cachen'
		},
		{
			field: 'importStudentsFromZPA',
			title: 'Studierende',
			desc: 'ZPA-Infos der Studierenden mit Anmeldungen holen'
		}
	];

	// Uploads (ins ZPA übertragen) — die Prüfungs-Uploads haben ein dryRun-Argument.
	/** @type {{ field: string, title: string, desc: string, hasDryRun: boolean }[]} */
	const uploads = [
		{
			field: 'uploadExamsToZPA',
			title: 'Prüfungen',
			desc: 'ohne Räume und Aufsichten',
			hasDryRun: true
		},
		{
			field: 'uploadExamsWithRoomsToZPA',
			title: 'Prüfungen mit Räumen',
			desc: 'inkl. geplanter Räume',
			hasDryRun: true
		},
		{
			field: 'uploadExamsWithInvigilatorsToZPA',
			title: 'Prüfungen mit Räumen & Aufsichten',
			desc: 'inkl. geplanter Räume und Aufsichten',
			hasDryRun: true
		},
		{
			field: 'uploadStudentRegsToZPA',
			title: 'Anmeldungen',
			desc: 'Studierenden-Anmeldungen ins ZPA übertragen',
			hasDryRun: false
		}
	];
</script>

<div class="mx-2 mt-4 flex flex-col gap-6">
	<h1 class="text-2xl font-semibold">ZPA — Veröffentlichung</h1>

	<!-- ZPA-Validierungen: eigene Ampel, manuell starten -->
	<div class="flex flex-col gap-3">
		<div class="flex flex-wrap items-baseline gap-2">
			<h2 class="text-xl font-semibold">ZPA-Validierung</h2>
			<span class="text-sm text-base-content/60">manuell starten — eigene Ampel in der Navbar</span>
		</div>
		<ValidationGroup validators={zpaValidators} storeId="zpa" autostart={false} />
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<!-- Downloads -->
		<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="flex items-center gap-2">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-info/15 text-info">
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 20h16" />
					</svg>
				</span>
				<h2 class="text-lg font-semibold">Aus dem ZPA laden</h2>
			</div>
			{#each downloads as d}
				<StreamAction
					field={d.field}
					title={d.title}
					description={d.desc}
					accent="info"
					actionLabel="Laden"
					on:done={refreshLog}
				/>
			{/each}
		</div>

		<!-- Uploads -->
		<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="flex items-center gap-2">
				<span
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 20V8m0 0l-4 4m4-4l4 4" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4h16" />
					</svg>
				</span>
				<h2 class="text-lg font-semibold">Ins ZPA übertragen</h2>
			</div>
			{#each uploads as u}
				<StreamAction
					field={u.field}
					title={u.title}
					description={u.desc}
					hasDryRun={u.hasDryRun}
					accent="success"
					actionLabel="Übertragen"
					on:done={refreshLog}
				/>
			{/each}
		</div>
	</div>

	<!-- Sync-Verlauf (zeitgestempelte Historie aller Transfers) -->
	<div class="flex flex-col gap-3">
		<div class="flex flex-wrap items-baseline gap-2">
			<h2 class="text-xl font-semibold">Sync-Verlauf</h2>
			<span class="text-sm text-base-content/60">letzte Im-/Exporte mit Zeitstempel</span>
			<button class="btn btn-ghost btn-xs" on:click={refreshLog}>↻ neu laden</button>
		</div>
		{#await data.syncLog}
			<div class="flex items-center gap-2 text-sm text-base-content/50">
				<span class="loading loading-spinner loading-sm"></span> lädt …
			</div>
		{:then entries}
			<SyncLog {entries} />
		{:catch}
			<div class="alert alert-error py-2 text-sm">
				<span>Sync-Verlauf konnte nicht geladen werden.</span>
			</div>
		{/await}
	</div>
</div>
