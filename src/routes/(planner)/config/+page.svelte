<script>
	import { httpErrorMessage } from '#lib/errors/plannerErrors.js';
	import { refreshAll } from '$app/navigation';
	import SemesterConfigForm from '#lib/config/SemesterConfigForm.svelte';
	import SemesterDump from '#lib/backup/SemesterDump.svelte';
	import WriteButton from '#lib/WriteButton.svelte';
	import PageIntro from '#lib/help/PageIntro.svelte';

	let { data } = $props();

	/** @type {SemesterConfigForm | undefined} */
	let formComp = $state();
	let saving = $state(false);
	let errorMsg = $state('');
	/** @type {string[]} */
	let warnings = $state([]);
	let showWarnings = $state(false);
	let savedAt = $state('');

	// Planer des Semesters. Der Default steht in der Serverkonfiguration; hat dieses
	// Semester keinen eigenen (inherited), bleiben die Felder leer und der Default
	// steht als Platzhalter darin.
	let planerName = $state(data.planer?.inherited ? '' : (data.planer?.name ?? ''));
	let planerEmail = $state(data.planer?.inherited ? '' : (data.planer?.email ?? ''));
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

		// Name und E-Mail gehören zusammen: beide leer = Default der Serverkonfiguration,
		// beide gefüllt = eigener Planer. Nur eines von beiden würde als
		// "Prüfungsplanung FK07 <jemand.anders@hm.edu>" verschickt — das Backend lehnt es
		// ab, hier fangen wir es vor der Runde ab.
		const name = planerName.trim();
		const email = planerEmail.trim();
		if (!name !== !email) {
			planerError =
				'Name und E-Mail gehören zusammen: beide ausfüllen oder beide leer lassen. Leer gilt die Voreinstellung des Servers.';
			return;
		}

		planerSaving = true;
		planerError = '';
		planerSavedAt = '';
		try {
			const res = await fetch('/api/semester/setSemesterPlaner', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name,
					email,
					testMail: planerTestMail.trim(),
					cc: planerCc.trim(),
					noreplyMail: planerNoreplyMail.trim(),
					noreplyName: planerNoreplyName.trim()
				})
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				planerError = result?.error ?? httpErrorMessage(res.status);
				return;
			}
			planerSavedAt = new Date().toLocaleTimeString('de-DE');
			// Effektivwerte/Platzhalter neu laden (können sich durch die Overrides ändern)
			await refreshAll();
		} catch (e) {
			planerError = e instanceof Error ? e.message : String(e);
		} finally {
			planerSaving = false;
		}
	}

	// Verwirft den eigenen Planer des Semesters komplett — Identität und alle vier
	// Sender-Overrides. Danach gilt wieder der Default aus der Serverkonfiguration.
	async function resetPlaner() {
		if (planerSaving) return;
		planerSaving = true;
		planerError = '';
		planerSavedAt = '';
		try {
			const res = await fetch('/api/semester/resetSemesterPlaner', { method: 'POST' });
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				planerError = result?.error ?? httpErrorMessage(res.status);
				return;
			}
			planerName = '';
			planerEmail = '';
			planerTestMail = '';
			planerCc = '';
			planerNoreplyMail = '';
			planerNoreplyName = '';
			planerSavedAt = new Date().toLocaleTimeString('de-DE');
			await refreshAll();
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
				errorMsg = result?.error ?? httpErrorMessage(res.status);
				return;
			}
			const out = result.setSemesterConfigInput;
			if (!out?.ok) {
				errorMsg =
					'Der Server hat die Konfiguration nicht übernommen. Bitte die Eingaben prüfen und noch einmal speichern.';
				return;
			}
			warnings = out.warnings ?? [];
			showWarnings = warnings.length > 0;
			savedAt = new Date().toLocaleTimeString('de-DE');
			// Tage/Anfangszeiten/reservierte Zeiten je Studiengang neu berechnet → Config neu laden
			await refreshAll();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<PageIntro title="Semester-Konfiguration" subtitle={data.semester} help="ablauf">
		{#snippet actions()}
			<a class="btn btn-outline btn-sm" href="/config/new">+ Neues Semester anlegen</a>
		{/snippet}
		Hier legst du für das ausgewählte Semester fest, wer als Planer die E-Mails verschickt, in welchem
		Zeitraum und zu welchen Startzeiten geprüft wird und wann die gemeinsamen Studiengänge prüfen dürfen.
		Das kommt ganz am Anfang, noch vor den Importen: Vorplanung, Terminplan, Räume und Aufsichten richten
		sich nach diesen Angaben.
	</PageIntro>
	{#if !data.config}
		<div class="alert alert-warning py-2 text-sm">
			<span>
				Für dieses Semester ist noch nichts gespeichert. Felder ausfüllen und unten „Speichern“
				drücken.
			</span>
		</div>
	{/if}

	<!-- Planer: gilt für dieses Semester. Leere Felder = Default aus der
	     Serverkonfiguration, der jeweils als Platzhalter dahintersteht. -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="flex flex-wrap items-center gap-2">
			<span class="font-semibold">Planer</span>
			<span class="text-sm text-base-content/50">
				gilt für {data.semester || 'dieses Semester'}
			</span>
			{#if data.planer?.inherited}
				<span class="badge badge-ghost badge-sm">Voreinstellung des Servers</span>
			{/if}
		</div>
		<div class="flex flex-wrap items-end gap-3">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Name</span>
				<input
					type="text"
					class="input input-bordered input-sm w-full sm:w-72"
					placeholder={data.planer?.defaultName ?? ''}
					bind:value={planerName}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">E-Mail</span>
				<input
					type="email"
					class="input input-bordered input-sm w-full sm:w-72"
					placeholder={data.planer?.defaultEmail ?? ''}
					bind:value={planerEmail}
				/>
			</label>
		</div>
		<span class="text-xs text-base-content/50">
			Name und E-Mail stehen als Absender in den E-Mails, die Plexams verschickt; Antworten darauf
			gehen an diese Adresse. Beide ausfüllen, um diesem Semester einen eigenen Planer zu geben,
			oder beide leer lassen: dann gilt die Voreinstellung des Servers, die grau im Feld steht.
		</span>

		<!-- Optionale Sender-Identität-Overrides: leer = Default. Der Platzhalter
		     zeigt jeweils den aktuell effektiven Wert (das, was bei leer benutzt wird). -->
		<div class="flex flex-col gap-2">
			<span class="text-xs font-medium text-base-content/50">
				Weitere Absender-Angaben (optional) — leer lassen für den grauen Wert im Feld
			</span>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">
						Testadresse: hierhin gehen alle Probeläufe
					</span>
					<input
						type="email"
						class="input input-bordered input-sm w-full sm:w-72"
						placeholder={data.planer?.effectiveTestMail ?? data.planer?.defaultMail ?? ''}
						bind:value={planerTestMail}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">
						Cc: bekommt jede echt verschickte E-Mail
					</span>
					<input
						type="email"
						class="input input-bordered input-sm w-full sm:w-72"
						placeholder={data.planer?.effectiveCc ?? data.planer?.defaultMail ?? ''}
						bind:value={planerCc}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">
						Antwortadresse für Jira-Mails
					</span>
					<input
						type="email"
						class="input input-bordered input-sm w-full sm:w-72"
						placeholder={data.planer?.effectiveNoreplyMail ?? ''}
						bind:value={planerNoreplyMail}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">
						Anzeigename der Antwortadresse für Jira-Mails
					</span>
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
			<WriteButton class="btn btn-outline btn-sm" disabled={planerSaving} onclick={resetPlaner}>
				Auf Voreinstellung des Servers zurücksetzen
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

	<!-- Nach dem Speichern lädt refreshAll die serverseitig neu berechnete
	     Config (Tage/Anfangszeiten/reservierte Zeiten je Studiengang). {#key} baut das
	     Formular dann neu auf, sodass sein interner $state frisch aus der Config
	     initialisiert wird. -->
	{#key data.config}
		<SemesterConfigForm
			bind:this={formComp}
			config={data.config}
			days={data.days}
			jointPrograms={data.jointPrograms}
			effective={data.effective}
		/>
	{/key}

	<div class="flex items-center gap-3">
		<WriteButton class="btn btn-primary" disabled={saving} onclick={save}>
			{saving ? 'speichert …' : 'Speichern'}
		</WriteButton>
		<span class="text-xs text-base-content/50">
			Speichert Zeitraum, Startzeiten, Abstände, E-Mail-Adressen und reservierte Zeiten. Schon
			geplante Termine bleiben dabei unverändert; passen sie danach nicht mehr, sagt ein Hinweis, wo
			du nachsehen musst.
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
