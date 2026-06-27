<script>
	import SemesterConfigForm from '$lib/config/SemesterConfigForm.svelte';
	import WriteButton from '$lib/WriteButton.svelte';

	export let data;

	/** @type {SemesterConfigForm} */
	let formComp;
	let name = '';
	let creating = false;
	let errorMsg = '';
	/** @type {string[]} */
	let warnings = [];
	let createdName = '';

	$: nameOk = /^\d{4}-(SS|WS)$/.test(name.trim());

	async function create() {
		if (creating) return;
		if (!nameOk) {
			errorMsg = 'Name muss dem Muster YYYY-SS oder YYYY-WS entsprechen (z. B. 2027-SS).';
			return;
		}
		creating = true;
		errorMsg = '';
		warnings = [];
		createdName = '';
		try {
			const res = await fetch('/api/createSemester', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ semester: name.trim(), input: formComp.getInput() })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				// u. a. „Config existiert schon" kommt als GraphQL-Error
				errorMsg = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			const out = result.createSemester;
			if (!out?.ok) {
				errorMsg = 'Anlegen nicht möglich.';
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
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Neues Semester anlegen</h1>
		<a class="btn btn-ghost btn-sm" href="/config">← zur Konfiguration</a>
	</div>

	<!-- Wichtiger Hinweis: Server bleibt an aktuelles Semester gebunden -->
	<div class="alert alert-info py-2 text-sm">
		<span>
			Der laufende <strong>plexams</strong>-Server bleibt an sein aktuelles Semester
			{#if data.currentSemester}(<strong>{data.currentSemester}</strong>){/if} gebunden. Das Anlegen
			schreibt nur die Config für das neue Semester — um es zu <strong>beplanen</strong>, muss
			plexams für das neue Semester (neu) gestartet werden.
		</span>
	</div>

	<p class="max-w-3xl text-sm text-base-content/60">
		Die Felder sind aus dem aktuellen Semester <strong>vorbefüllt</strong> (Slots, E-Mails, MUC.DAI-Slots
		übernehmen — Termine anpassen).
	</p>

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}

	{#if createdName}
		<div class="alert alert-success flex-col items-start gap-1 py-3 text-sm">
			<span class="font-semibold">Semester {createdName} angelegt.</span>
			<span>
				Nächster Schritt: <strong>plexams für {createdName} (neu) starten</strong>, um es zu
				beplanen. Der hier laufende Server plant weiterhin
				{#if data.currentSemester}{data.currentSemester}{:else}das bisherige Semester{/if}.
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
		<span class="text-xs text-base-content/50"
			>Muster: <span class="font-mono">YYYY-SS</span> oder
			<span class="font-mono">YYYY-WS</span>.</span
		>
	</div>

	<SemesterConfigForm bind:this={formComp} config={data.defaults} />

	<div class="flex items-center gap-3">
		<WriteButton
			class="btn btn-primary"
			disabled={creating || !nameOk || !!createdName}
			on:click={create}
		>
			{creating ? 'legt an …' : 'Semester anlegen'}
		</WriteButton>
		<span class="text-xs text-base-content/50">
			Existiert schon eine Config für den Namen, meldet der Server einen Fehler.
		</span>
	</div>
</div>
