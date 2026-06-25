<script>
	import { invalidateAll } from '$app/navigation';
	import SemesterConfigForm from '$lib/config/SemesterConfigForm.svelte';

	export let data;

	/** @type {SemesterConfigForm} */
	let formComp;
	let saving = false;
	let errorMsg = '';
	/** @type {string[]} */
	let warnings = [];
	let showWarnings = false;
	let savedAt = '';

	async function save() {
		if (saving) return;
		saving = true;
		errorMsg = '';
		warnings = [];
		savedAt = '';
		try {
			const res = await fetch('/api/setSemesterConfigInput', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input: formComp.getInput() })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				errorMsg = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			const out = result.setSemesterConfigInput;
			if (!out?.ok) {
				errorMsg = 'Speichern nicht möglich.';
				return;
			}
			warnings = out.warnings ?? [];
			showWarnings = warnings.length > 0;
			savedAt = new Date().toLocaleTimeString('de-DE');
			// Tage/Slots/MUC.DAI-Slots wurden neu berechnet → Config neu laden
			await invalidateAll();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Semester-Konfiguration</h1>
		{#if data.semester}<span class="badge badge-primary badge-lg">{data.semester}</span>{/if}
		{#if !data.config}
			<span class="badge badge-warning badge-lg">neu — noch keine Config</span>
		{/if}
		<div class="flex-1"></div>
		<a class="btn btn-outline btn-sm" href="/config/new">+ Neues Semester anlegen</a>
	</div>

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}
	{#if savedAt && warnings.length === 0}
		<div class="alert alert-success py-2 text-sm"><span>Gespeichert ({savedAt}).</span></div>
	{/if}

	<SemesterConfigForm bind:this={formComp} config={data.config} />

	<div class="flex items-center gap-3">
		<button class="btn btn-primary" disabled={saving} on:click={save}>
			{saving ? 'speichert …' : 'Speichern'}
		</button>
		<span class="text-xs text-base-content/50">
			Validierungsfehler (z. B. ungültiger Zeitraum oder Slot) meldet der Server.
		</span>
	</div>
</div>

<!-- Hinweise nach erfolgreichem Speichern (nicht-blockierend) -->
{#if showWarnings}
	<div class="modal modal-open">
		<div class="modal-box">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<span class="badge badge-success badge-sm">gespeichert</span> Hinweise
			</h2>
			<ul class="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm">
				{#each warnings as w}
					<li class="text-warning">{w}</li>
				{/each}
			</ul>
			<div class="modal-action">
				<button class="btn btn-sm" on:click={() => (showWarnings = false)}>verstanden</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={() => (showWarnings = false)}
		></button>
	</div>
{/if}
