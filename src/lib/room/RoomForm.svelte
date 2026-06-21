<script>
	import { createEventDispatcher } from 'svelte';

	// Gemeinsames Formular zum Anlegen und Bearbeiten eines Raums. Beim
	// Bearbeiten ist der name (Schlüssel) gesperrt. deactivated ist NICHT Teil
	// des Inputs (Aktiv-Status nur über setRoomActive).

	/** 'add' | 'edit'
	 * @type {string} */
	export let mode = 'add';
	/** vorhandener Raum zum Vorbefüllen (edit)
	 * @type {any} */
	export let room = null;

	const dispatch = createEventDispatcher();

	const empty = {
		name: '',
		seats: 0,
		handicap: false,
		lab: false,
		placesWithSocket: false,
		needsRequest: false,
		exahm: false,
		seb: false,
		sebSeats: 0,
		hmebSeats: 0
	};

	/** @param {any} r */
	function pick(r) {
		return {
			name: r.name ?? '',
			seats: r.seats ?? 0,
			handicap: !!r.handicap,
			lab: !!r.lab,
			placesWithSocket: !!r.placesWithSocket,
			needsRequest: !!r.needsRequest,
			exahm: !!r.exahm,
			seb: !!r.seb,
			sebSeats: r.sebSeats ?? 0,
			hmebSeats: r.hmebSeats ?? 0
		};
	}

	let form = room ? pick(room) : { ...empty };

	let saving = false;
	/** @type {string | null} */
	let errorMsg = null;

	$: nameError = form.name.trim() === '' ? 'Name ist erforderlich.' : '';
	$: seatsError = !(Number(form.seats) > 0) ? 'Plätze muss eine Zahl > 0 sein.' : '';
	$: formValid = !nameError && !seatsError;

	const FLAGS = [
		{ key: 'handicap', label: 'NTA (Handicap)' },
		{ key: 'lab', label: 'Labor' },
		{ key: 'placesWithSocket', label: 'Steckdosen' },
		{ key: 'needsRequest', label: 'Anforderung nötig' },
		{ key: 'exahm', label: 'EXaHM' },
		{ key: 'seb', label: 'SEB' }
	];

	async function submit() {
		if (!formValid) {
			errorMsg = 'Bitte die markierten Eingaben prüfen.';
			return;
		}
		/** @type {any} */
		const input = {
			name: form.name,
			seats: Number(form.seats),
			handicap: form.handicap,
			lab: form.lab,
			placesWithSocket: form.placesWithSocket,
			needsRequest: form.needsRequest,
			exahm: form.exahm,
			seb: form.seb
		};
		if (form.seb) {
			input.sebSeats = Number(form.sebSeats) || 0;
			input.hmebSeats = Number(form.hmebSeats) || 0;
		}

		saving = true;
		errorMsg = null;
		const url = mode === 'edit' ? '/api/updateRoom' : '/api/addRoom';
		let data;
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input })
			});
			data = await res.json().catch(() => ({}));
			if (!res.ok || data?.error) {
				errorMsg = data?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
			return;
		} finally {
			saving = false;
		}
		dispatch('saved', data);
	}
</script>

<div class="flex flex-col gap-3">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">
				Name {#if mode === 'edit'}<span class="text-base-content/40">(gesperrt)</span>{/if}
			</span>
			<input
				type="text"
				placeholder="z. B. R1.234"
				class="input input-bordered input-sm {nameError && mode === 'add' ? 'input-error' : ''}"
				bind:value={form.name}
				readonly={mode === 'edit'}
				class:input-disabled={mode === 'edit'}
			/>
			{#if nameError && mode === 'add'}<span class="text-xs text-error">{nameError}</span>{/if}
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Plätze</span>
			<input
				type="number"
				min="1"
				class="input input-bordered input-sm {seatsError ? 'input-error' : ''}"
				bind:value={form.seats}
			/>
			{#if seatsError}<span class="text-xs text-error">{seatsError}</span>{/if}
		</label>
	</div>

	<div class="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
		{#each FLAGS as f}
			<label class="label cursor-pointer justify-start gap-2 px-0">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={form[f.key]} />
				<span class="label-text">{f.label}</span>
			</label>
		{/each}
	</div>

	{#if form.seb}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">SEB-Plätze</span>
				<input type="number" min="0" class="input input-bordered input-sm" bind:value={form.sebSeats} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">HMEB-Plätze</span>
				<input
					type="number"
					min="0"
					class="input input-bordered input-sm"
					bind:value={form.hmebSeats}
				/>
			</label>
		</div>
	{/if}

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}

	<div class="flex justify-end gap-2">
		<button class="btn btn-ghost btn-sm" on:click={() => dispatch('cancel')} disabled={saving}>
			Abbrechen
		</button>
		<button class="btn btn-primary btn-sm gap-2" on:click={submit} disabled={saving || !formValid}>
			{#if saving}<span class="loading loading-spinner loading-xs"></span>{/if}
			{mode === 'edit' ? 'Speichern' : 'Anlegen'}
		</button>
	</div>
</div>
