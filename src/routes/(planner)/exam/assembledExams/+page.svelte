<script>
	import PageIntro from '#lib/help/PageIntro.svelte';
	import Term from '#lib/help/Term.svelte';
	import { refreshAll } from '$app/navigation';
	import AssembledExamsTable from '#lib/exam/AssembledExamsTable.svelte';
	import WriteButton from '#lib/WriteButton.svelte';
	import {
		assembledExamsState,
		checkAssembledExams,
		resetAssembledExams,
		resettingAssembled
	} from '#lib/assembledExams/store.js';
	import { studentRegsState } from '#lib/studentRegs/store.js';
	import { preparing, regeneratePreparation } from '#lib/prepare.js';
	let { data } = $props();

	// Vorbedingungen: ZPA & Primuss importiert UND die manuellen Haken
	// „ZPA- & Primuss-Prüfungen verknüpft" und „Constraints eingepflegt" gesetzt.
	// Connected Exams werden live berechnet — kein separater Schritt.
	let canGenerate = $derived(
		!!data.conditions?.zpaImported &&
			!!data.conditions?.primussImported &&
			!!data.conditions?.zpaPrimussConnected &&
			!!data.conditions?.constraintsEntered
	);
	let stale = $derived($assembledExamsState.dirty || $studentRegsState.dirty);

	/** @type {{ changes: any[]; studentCount: number } | null} */
	let prepResult = $state(null);
	let prepError = $state('');
	const KIND_BADGE = /** @type {Record<string, string>} */ ({
		added: 'badge-success',
		removed: 'badge-error',
		changed: 'badge-warning'
	});
	const KIND_LABEL = /** @type {Record<string, string>} */ ({
		added: 'neu',
		removed: 'entfernt',
		changed: 'geändert'
	});

	async function runPrepare() {
		if (!canGenerate || $preparing) return;
		prepError = '';
		const { changes, studentCount, error } = await regeneratePreparation();
		if (error) {
			prepError = error;
			return;
		}
		prepResult = { changes, studentCount };
		// Load-Daten neu holen, damit die eben erzeugten Prüfungen in der Tabelle
		// erscheinen (data.plannedExams kommt aus dem SSR-load).
		await refreshAll();
	}

	// --- Aufbereitete Prüfungen zurücksetzen (resetAssembledExams) ---
	// Destruktiv: löscht die gecachten Assembled Exams. Backend blockt bei
	// laufender Validierung/Transfer/E-Mail. Nach Erfolg Zustand + Views neu
	// laden — der Planning-State-Punkt „Aufbereitete Prüfungen erstellt" ist
	// danach wieder offen.
	let resetError = $state('');
	/** @type {number | null} */
	let resetRemoved = $state(null);

	async function runReset() {
		if ($resettingAssembled || $preparing) return;
		if (
			!confirm(
				'Wirklich die aufbereiteten Prüfungen zurücksetzen? Der Cache wird gelöscht und muss danach neu generiert werden.'
			)
		)
			return;
		resetError = '';
		resetRemoved = null;
		const { removed, error } = await resetAssembledExams();
		if (error) {
			resetError = error;
			return;
		}
		resetRemoved = removed;
		prepResult = null;
		await checkAssembledExams(); // Zustand neu holen (jetzt veraltet/offen)
		await refreshAll(); // Assembled-Exams-Views neu laden
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<PageIntro
		title="Aufbereitete Prüfungen"
		count={data.plannedExams.length}
		subtitle="mit Anmeldungen"
		help="glossar-aufbereitete-pruefung"
	>
		Beim Aufbereiten führt Plexams je Prüfung alles zusammen, was bisher getrennt vorliegt: die
		Daten aus dem <Term id="zpa" />, die Anmeldungen aus <Term id="primuss" />, die
		<Term id="nta">Nachteilsausgleiche</Term> und die <Term id="vorgabe">Vorgaben</Term>.
		Terminplanung, Raumplanung und Aufsichten arbeiten nur mit diesen aufbereiteten Prüfungen. Das
		ist der letzte Schritt der Vorbereitung.
	</PageIntro>

	<!-- Generieren (Prüfungen + StudentRegs in einem Schritt) -->
	<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="flex flex-wrap items-center gap-3">
			<button
				class="btn btn-primary btn-sm"
				disabled={!canGenerate || $preparing || $resettingAssembled}
				onclick={runPrepare}
			>
				{$preparing ? 'generiert …' : stale ? 'neu generieren' : 'Generieren'}
			</button>
			<WriteButton
				class="btn btn-outline btn-error btn-sm"
				disabled={$preparing || $resettingAssembled}
				title="Löscht alle aufbereiteten Prüfungen. Termine, Räume und Vorgaben bleiben erhalten; mit „Generieren“ lassen sie sich jederzeit neu erzeugen."
				onclick={runReset}
			>
				{$resettingAssembled ? 'setzt zurück …' : 'Zurücksetzen'}
			</WriteButton>
			{#if !canGenerate}
				<span class="text-sm text-warning">
					Generieren geht erst, wenn auf der <a class="link" href="/">Startseite</a> vier Schritte abgehakt
					sind: Prüfungen aus ZPA importiert, Primuss-Anmeldedaten importiert, ZPA- &amp; Primuss-Prüfungen
					verknüpft und die Vorgaben eingetragen.
				</span>
			{:else if stale}
				<span class="text-sm text-warning">
					⚠ Seit dem letzten Generieren wurden Anmeldungen, Nachteilsausgleiche oder Vorgaben
					geändert. Bitte neu generieren, sonst plant Plexams mit dem alten Stand.
				</span>
			{:else}
				<span class="text-sm text-base-content/50">
					Erzeugt die aufbereiteten Prüfungen und je Studierender:m die Liste der Anmeldungen neu.
					Termine und Räume bleiben dabei erhalten. Dauert wenige Sekunden.
				</span>
			{/if}
		</div>

		{#if prepError}
			<div class="alert alert-error py-2 text-sm"><span>{prepError}</span></div>
		{/if}

		{#if resetError}
			<div class="alert alert-error py-2 text-sm"><span>{resetError}</span></div>
		{/if}

		{#if resetRemoved !== null}
			<div class="alert alert-success py-2 text-sm">
				<span>
					Aufbereitete Prüfungen zurückgesetzt — {resetRemoved} Prüfung(en) entfernt.
				</span>
				<button class="btn btn-ghost btn-xs" onclick={() => (resetRemoved = null)}>
					schließen
				</button>
			</div>
		{/if}

		{#if prepResult}
			<div class="rounded-lg border border-success/40 bg-success/5 p-2">
				<div class="flex items-center gap-2 text-sm font-medium">
					Generiert: {prepResult.changes.length} Änderung(en) · {prepResult.studentCount} StudentRegs
					<div class="flex-1"></div>
					<button class="btn btn-ghost btn-xs" onclick={() => (prepResult = null)}>
						schließen
					</button>
				</div>
				{#if prepResult.changes.length}
					<ul class="mt-1 flex max-h-72 flex-col gap-1 overflow-y-auto text-sm">
						{#each prepResult.changes as c}
							<li class="rounded border border-base-300/40 p-1.5">
								<div class="flex flex-wrap items-center gap-2">
									<span class="badge badge-sm {KIND_BADGE[c.kind] ?? 'badge-ghost'}">
										{KIND_LABEL[c.kind] ?? c.kind}
									</span>
									<span class="font-mono tabular-nums">{c.ancode}</span>
									<span>{c.module}</span>
								</div>
								{#if (c.details ?? []).length}
									<ul class="mt-1 ml-1 list-inside list-disc text-xs text-base-content/70">
										{#each c.details as d}
											<li>{d}</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<span class="text-sm opacity-70">an den aufbereiteten Prüfungen nichts geändert</span>
				{/if}
			</div>
		{/if}
	</div>

	<AssembledExamsTable exams={data.plannedExams} />
</div>
