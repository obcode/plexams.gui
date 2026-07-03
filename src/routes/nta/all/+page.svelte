<script>
	import { fade } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import NtaTr from '$lib/nta/NtaTR.svelte';
	import NTAForm from '$lib/nta/NTAForm.svelte';

	export let data;

	let searchTerm = '';
	let roomAlone = false;
	let currentSemester = false;
	/** 'all' | 'active' | 'inactive' */
	let activeFilter = 'all';

	$: filteredNTAs = data.ntas.filter((/** @type {any} */ nta) => {
		if (searchTerm && !nta.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
		if (roomAlone && !nta.needsRoomAlone) return false;
		if (currentSemester && nta.lastSemester != data.semester) return false;
		if (activeFilter === 'active' && nta.deactivated) return false;
		if (activeFilter === 'inactive' && !nta.deactivated) return false;
		return true;
	});

	// Die mtknr ist der Schlüssel und muss eindeutig sein. Doppelte mtknr als
	// klare Fehlermeldung anzeigen (statt die Seite per each-Key abstürzen zu
	// lassen) — muss serverseitig bereinigt werden.
	$: duplicateMtknr = (() => {
		const seen = new Set();
		const dup = new Set();
		for (const nta of data.ntas) {
			if (seen.has(nta.mtknr)) dup.add(nta.mtknr);
			else seen.add(nta.mtknr);
		}
		return [...dup];
	})();

	// Modal zum Anlegen/Bearbeiten
	let showModal = false;
	/** @type {any} */
	let editNta = null;

	function openAdd() {
		editNta = null;
		showModal = true;
	}
	/** @param {any} nta */
	function openEdit(nta) {
		editNta = nta;
		showModal = true;
	}
	async function onSaved() {
		showModal = false;
		await invalidateAll();
	}

	/** @type {string | null} */
	let toggleError = null;
	/** @param {any} nta */
	async function onToggle(nta) {
		toggleError = null;
		try {
			const res = await fetch('/api/setNTAActive', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				// aktiv umschalten: neuer active-Wert = aktueller deactivated-Wert
				body: JSON.stringify({ mtknr: nta.mtknr, active: !!nta.deactivated })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				toggleError = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
		} catch (err) {
			toggleError = err instanceof Error ? err.message : String(err);
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">NTA-Stammdaten</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.ntas.length}</span>
		<span class="text-sm text-base-content/60">{filteredNTAs.length} ausgewählt</span>
		<div class="flex-1"></div>
		<button class="btn btn-primary btn-sm gap-2" on:click={openAdd}>+ NTA hinzufügen</button>
	</div>

	<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
		<input
			class="input input-bordered input-sm flex-1"
			type="text"
			bind:value={searchTerm}
			placeholder="Suche Studierende"
		/>
		<label class="label cursor-pointer gap-2">
			<span class="label-text">Anmeldungen im aktuellen Semester</span>
			<input type="checkbox" bind:checked={currentSemester} class="checkbox checkbox-sm" />
		</label>
		<label class="label cursor-pointer gap-2">
			<span class="label-text">eigener Raum</span>
			<input type="checkbox" bind:checked={roomAlone} class="checkbox checkbox-sm" />
		</label>
		<select class="select select-bordered select-sm" bind:value={activeFilter}>
			<option value="all">alle</option>
			<option value="active">nur aktive</option>
			<option value="inactive">nur inaktive</option>
		</select>
	</div>

	{#if toggleError}
		<div class="alert alert-error py-2 text-sm"><span>{toggleError}</span></div>
	{/if}

	{#if duplicateMtknr.length}
		<div class="alert alert-error text-sm">
			<span>
				Doppelte Matrikelnummer(n) in den Stammdaten:
				<span class="font-mono">{duplicateMtknr.join(', ')}</span>. Die mtknr ist der Schlüssel und
				muss eindeutig sein — bitte serverseitig bereinigen.
			</span>
		</div>
	{/if}

	<p class="text-xs text-base-content/50">
		Hinweis: Eine Deaktivierung wirkt erst bei der nächsten Aufbereitung/Generierung der Prüfungen.
	</p>

	{#key filteredNTAs}
		<div class="overflow-x-auto" transition:fade>
			<table class="table table-zebra w-full">
				<thead>
					<tr>
						<th>Name</th>
						<th>E-Mail</th>
						<th>Mtknr</th>
						<th>Ausgleich</th>
						<th>Bescheid von</th>
						<th>gültig bis</th>
						<th>zuletzt</th>
						<th>aktiv</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each filteredNTAs as nta}
						<NtaTr {nta} onedit={openEdit} ontoggle={onToggle} />
					{/each}
				</tbody>
			</table>
		</div>
	{/key}
</div>

{#if showModal}
	<div class="modal modal-open" transition:fade>
		<div class="modal-box max-w-2xl">
			<h3 class="mb-4 text-lg font-semibold">
				{editNta ? `NTA bearbeiten: ${editNta.name}` : 'NTA hinzufügen'}
			</h3>
			<NTAForm
				mode={editNta ? 'edit' : 'add'}
				nta={editNta}
				onsaved={onSaved}
				oncancel={() => (showModal = false)}
			/>
		</div>
		<button class="modal-backdrop" aria-label="Schließen" on:click={() => (showModal = false)}
		></button>
	</div>
{/if}
