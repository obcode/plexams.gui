<script>
	import { invalidateAll } from '$app/navigation';
	import SemesterConfigForm from '$lib/config/SemesterConfigForm.svelte';
	import SemesterDump from '$lib/backup/SemesterDump.svelte';
	import WriteButton from '$lib/WriteButton.svelte';

	let { data } = $props();

	/** @type {SemesterConfigForm | undefined} */
	let formComp = $state();
	let saving = $state(false);
	let errorMsg = $state('');
	/** @type {string[]} */
	let warnings = $state([]);
	let showWarnings = $state(false);
	let savedAt = $state('');

	// Planer (global, semesterübergreifend in der DB)
	let planerName = $state(data.planer?.name ?? '');
	let planerEmail = $state(data.planer?.email ?? '');
	// Optionale Sender-Identität-Overrides: leer = Default (Backend leitet ab).
	// Vorbelegt mit dem gesetzten Override (nicht dem Effektivwert) — der
	// Effektivwert steht als Platzhalter darunter.
	let planerTestMail = $state(data.planer?.testMail ?? '');
	let planerCc = $state(data.planer?.cc ?? '');
	let planerNoreplyMail = $state(data.planer?.noreplyMail ?? '');
	let planerNoreplyName = $state(data.planer?.noreplyName ?? '');
	let planerSaving = $state(false);
	let planerError = $state('');
	let planerSavedAt = $state('');

	async function savePlaner() {
		if (planerSaving) return;
		planerSaving = true;
		planerError = '';
		planerSavedAt = '';
		try {
			const res = await fetch('/api/semester/setPlaner', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name: planerName.trim(),
					email: planerEmail.trim(),
					testMail: planerTestMail.trim(),
					cc: planerCc.trim(),
					noreplyMail: planerNoreplyMail.trim(),
					noreplyName: planerNoreplyName.trim()
				})
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				planerError = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			planerSavedAt = new Date().toLocaleTimeString('de-DE');
			// Effektivwerte/Platzhalter neu laden (können sich durch die Overrides ändern)
			await invalidateAll();
		} catch (e) {
			planerError = e instanceof Error ? e.message : String(e);
		} finally {
			planerSaving = false;
		}
	}

	async function save() {
		if (saving) return;
		saving = true;
		errorMsg = '';
		warnings = [];
		savedAt = '';
		try {
			const res = await fetch('/api/semester/setSemesterConfigInput', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input: formComp?.getInput() })
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
			// Tage/Anfangszeiten/MUC.DAI-Zeiten wurden neu berechnet → Config neu laden
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

	<!-- Planer (global, semesterübergreifend) -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex items-center gap-2">
			<span class="font-semibold">Planer</span>
			<span class="text-sm text-base-content/50">global, semesterübergreifend</span>
		</div>
		<div class="flex flex-wrap items-end gap-3">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Name</span>
				<input type="text" class="input input-bordered input-sm w-72" bind:value={planerName} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">E-Mail</span>
				<input type="email" class="input input-bordered input-sm w-72" bind:value={planerEmail} />
			</label>
		</div>

		<!-- Optionale Sender-Identität-Overrides: leer = Default. Der Platzhalter
		     zeigt jeweils den aktuell effektiven Wert (das, was bei leer benutzt wird). -->
		<div class="flex flex-col gap-2">
			<span class="text-xs font-medium text-base-content/50">
				Sender-Identität (optional) — leer lassen für den Default in Klammern
			</span>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Testadresse (Probeläufe)</span>
					<input
						type="email"
						class="input input-bordered input-sm w-full sm:w-72"
						placeholder={data.planer?.effectiveTestMail ?? data.planer?.defaultMail ?? ''}
						bind:value={planerTestMail}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Cc (echter Versand)</span>
					<input
						type="email"
						class="input input-bordered input-sm w-full sm:w-72"
						placeholder={data.planer?.effectiveCc ?? data.planer?.defaultMail ?? ''}
						bind:value={planerCc}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Noreply-Adresse</span>
					<input
						type="email"
						class="input input-bordered input-sm w-full sm:w-72"
						placeholder={data.planer?.effectiveNoreplyMail ?? ''}
						bind:value={planerNoreplyMail}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Noreply-Anzeigename</span>
					<input
						type="text"
						class="input input-bordered input-sm w-full sm:w-72"
						placeholder={data.planer?.effectiveNoreplyName ?? ''}
						bind:value={planerNoreplyName}
					/>
				</label>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<WriteButton class="btn btn-primary btn-sm" disabled={planerSaving} onclick={savePlaner}>
				{planerSaving ? 'speichert …' : 'Planer speichern'}
			</WriteButton>
			{#if planerSavedAt}
				<span class="text-xs text-success">gespeichert ({planerSavedAt})</span>
			{/if}
		</div>
		{#if planerError}
			<div class="alert alert-error py-2 text-sm"><span>{planerError}</span></div>
		{/if}
	</div>

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}
	{#if savedAt && warnings.length === 0}
		<div class="alert alert-success py-2 text-sm"><span>Gespeichert ({savedAt}).</span></div>
	{/if}

	<!-- Nach dem Speichern lädt invalidateAll die serverseitig neu berechnete
	     Config (Tage/Anfangszeiten/MUC.DAI-Zeiten). {#key} baut das Formular dann neu
	     auf, sodass sein interner $state frisch aus der Config initialisiert wird. -->
	{#key data.config}
		<SemesterConfigForm
			bind:this={formComp}
			config={data.config}
			days={data.days}
			effective={data.effective}
		/>
	{/key}

	<div class="flex items-center gap-3">
		<WriteButton class="btn btn-primary" disabled={saving} onclick={save}>
			{saving ? 'speichert …' : 'Speichern'}
		</WriteButton>
		<span class="text-xs text-base-content/50">
			Validierungsfehler (z. B. ungültiger Zeitraum oder Slot) meldet der Server.
		</span>
	</div>

	<div class="divider my-2"></div>
	<SemesterDump />
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
				<button class="btn btn-sm" onclick={() => (showWarnings = false)}>verstanden</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={() => (showWarnings = false)}
		></button>
	</div>
{/if}
