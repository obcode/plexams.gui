<script>
	import { httpErrorMessage } from '#lib/errors/plannerErrors.js';
	import SemesterConfigForm from '#lib/config/SemesterConfigForm.svelte';
	import WriteButton from '#lib/WriteButton.svelte';
	import PageIntro from '#lib/help/PageIntro.svelte';

	let { data } = $props();

	/** @type {SemesterConfigForm | undefined} */
	let formComp = $state();
	let name = $state('');
	let creating = $state(false);
	let errorMsg = $state('');
	/** @type {string[]} */
	let warnings = $state([]);
	let createdName = $state('');

	let nameOk = $derived(/^\d{4}-(SS|WS)$/.test(name.trim()));

	async function create() {
		if (creating) return;
		if (!nameOk) {
			errorMsg = 'Der Name besteht aus Jahr, Bindestrich und SS oder WS, z. B. 2027-SS.';
			return;
		}
		creating = true;
		errorMsg = '';
		warnings = [];
		createdName = '';
		try {
			const res = await fetch('/api/semester/createSemester', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ semester: name.trim(), input: formComp?.getInput() })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				errorMsg = result?.error ?? httpErrorMessage(res.status);
				return;
			}
			const out = result.createSemester;
			if (!out?.ok) {
				errorMsg =
					'Der Server hat das Semester nicht angelegt. Bitte die Eingaben prüfen und noch einmal versuchen.';
				return;
			}
			createdName = name.trim();
			warnings = out.warnings ?? [];
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			creating = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<PageIntro title="Neues Semester anlegen" help="ablauf">
		{#snippet actions()}
			<a class="btn btn-ghost btn-sm" href="/config">← zur Semester-Konfiguration</a>
		{/snippet}
		Damit beginnt die Planung eines Semesters. Du gibst ihm einen Namen und legst Prüfungszeitraum, Startzeiten
		und E-Mail-Adressen fest. Die Felder sind mit den Werten des gerade ausgewählten Semesters{#if data.currentSemester}
			({data.currentSemester}){/if} vorbelegt; vor allem die Daten musst du anpassen. Ausgewählt bleibt
		danach das bisherige Semester: Zum neuen wechselst du oben in der Leiste über die Semesterauswahl.
	</PageIntro>

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}

	{#if createdName}
		<div class="alert alert-success flex-col items-start gap-1 py-3 text-sm">
			<span class="font-semibold">Semester {createdName} angelegt.</span>
			<span>
				Ausgewählt ist weiterhin
				{#if data.currentSemester}{data.currentSemester}{:else}das bisherige Semester{/if}. Nächster
				Schritt: oben in der Leiste über die Semesterauswahl zu <strong>{createdName}</strong> wechseln
				und dort unter „Semester-Konfiguration“ prüfen, ob der Planer stimmt.
			</span>
			{#if warnings.length}
				<div class="mt-1">
					<div class="font-medium">Hinweise:</div>
					<ul class="list-disc pl-5">
						{#each warnings as w}<li class="text-warning">{w}</li>{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Name -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Semester-Name</span>
			<input
				type="text"
				class="input input-bordered input-sm w-48 {name && !nameOk ? 'input-error' : ''}"
				placeholder="2027-SS"
				bind:value={name}
				disabled={!!createdName}
			/>
		</label>
		<span class="text-xs text-base-content/50">
			Jahr, Bindestrich und SS (Sommersemester) oder WS (Wintersemester), z. B. 2027-SS.
		</span>
	</div>

	<SemesterConfigForm
		bind:this={formComp}
		config={data.defaults}
		jointPrograms={data.jointPrograms}
	/>

	<div class="flex items-center gap-3">
		<WriteButton
			class="btn btn-primary"
			disabled={creating || !nameOk || !!createdName}
			onclick={create}
		>
			{creating ? 'legt an …' : 'Semester anlegen'}
		</WriteButton>
		<span class="text-xs text-base-content/50">
			Legt das Semester mit dieser Konfiguration an. Ein Semester, das es schon gibt, wird nicht
			überschrieben; seine Einstellungen änderst du unter „Semester-Konfiguration“.
		</span>
	</div>
</div>
