<script>
	import ValidationGroup from '$lib/validation/ValidationGroup.svelte';
	import { roomValidators } from '$lib/validation/validators';
	import { onMount } from 'svelte';

	/** @type {any} */
	let group;
	/** @type {any[]} */
	let waivers = [];
	let loadErr = '';
	let removeBusy = '';

	async function loadWaivers() {
		loadErr = '';
		try {
			const res = await fetch('/api/ntaRoomAloneWaivers');
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) throw new Error(d?.error || `Fehler (HTTP ${res.status})`);
			waivers = d.ntaRoomAloneWaivers ?? [];
		} catch (e) {
			loadErr = e instanceof Error ? e.message : String(e);
		}
	}
	onMount(loadWaivers);

	// Callback für die ValidatorCard: Verzicht speichern + Liste aktualisieren.
	// Die Karte stößt nach Erfolg selbst den Re-Run an (Fehler → Warnung).
	/** @param {string} mtknr @param {number} ancode @param {string} reason */
	async function acceptWaiver(mtknr, ancode, reason) {
		const res = await fetch('/api/addNtaRoomAloneWaiver', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ mtknr, ancode, reason })
		});
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) return { ok: false, error: d?.error || `Fehler (HTTP ${res.status})` };
		await loadWaivers();
		return { ok: true };
	}

	/** @param {any} w */
	async function removeWaiver(w) {
		const key = `${w.mtknr}-${w.ancode}`;
		removeBusy = key;
		loadErr = '';
		try {
			const res = await fetch('/api/removeNtaRoomAloneWaiver', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ mtknr: w.mtknr, ancode: w.ancode })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				loadErr = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await loadWaivers();
			// erneut prüfen → der Eintrag wird wieder zum Fehler
			group?.runByKey('validateRoomsPerExam');
		} finally {
			removeBusy = '';
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<h1 class="text-2xl font-semibold">Räume validieren</h1>

	<ValidationGroup
		bind:this={group}
		validators={roomValidators}
		storeId="rooms"
		onAcceptWaiver={acceptWaiver}
	/>

	<!-- Akzeptierte Verzichte „eigener Raum" -->
	<div class="rounded-lg border border-base-300 bg-base-100 p-4">
		<div class="mb-2 flex items-center gap-2">
			<span class="font-medium">Akzeptierte Verzichte „eigener Raum"</span>
			<span class="badge badge-ghost badge-sm">{waivers.length}</span>
		</div>
		{#if loadErr}
			<div class="alert alert-error py-2 text-sm"><span>{loadErr}</span></div>
		{/if}
		{#if waivers.length === 0}
			<div class="text-sm text-base-content/50">keine akzeptierten Verzichte</div>
		{:else}
			<div class="flex flex-col gap-1">
				{#each waivers as w}
					<div
						class="flex flex-wrap items-center gap-2 rounded border border-base-300 px-3 py-1.5 text-sm"
					>
						<span class="badge badge-outline badge-xs">Prüfung {w.ancode}</span>
						<span class="badge badge-outline badge-xs">MtkNr {w.mtknr}</span>
						<span class="min-w-0 flex-1 break-words text-base-content/70">{w.reason}</span>
						<button
							class="btn btn-ghost btn-xs"
							disabled={removeBusy === `${w.mtknr}-${w.ancode}`}
							on:click={() => removeWaiver(w)}>zurücknehmen</button
						>
					</div>
				{/each}
			</div>
		{/if}
		<div class="mt-2 text-xs text-base-content/50">
			Ein akzeptierter Verzicht macht aus dem „eigener Raum"-Fehler eine Warnung; der Grund wird in
			die NTA-Mail übernommen.
		</div>
	</div>
</div>
