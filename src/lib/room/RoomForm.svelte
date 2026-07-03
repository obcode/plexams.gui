<script lang="ts">
	import WriteButton from '$lib/WriteButton.svelte';

	// Gemeinsames Formular zum Anlegen und Bearbeiten eines Raums. Beim
	// Bearbeiten ist der name (Schlüssel) gesperrt. deactivated ist NICHT Teil
	// des Inputs (Aktiv-Status nur über setRoomActive).

	let {
		mode = 'add',
		room = null,
		onsaved,
		oncancel
	}: {
		mode?: string;
		room?: any;
		onsaved?: (data: any) => void;
		oncancel?: () => void;
	} = $props();

	const empty = {
		name: '',
		seats: 0,
		handicap: false,
		lab: false,
		placesWithSocket: false,
		requestWith: 'NONE',
		exahm: false,
		seb: false,
		sebSeats: 0,
		hmebSeats: 0
	};

	function pick(r: any) {
		return {
			name: r.name ?? '',
			seats: r.seats ?? 0,
			handicap: !!r.handicap,
			lab: !!r.lab,
			placesWithSocket: !!r.placesWithSocket,
			requestWith: r.requestWith ?? 'NONE',
			exahm: !!r.exahm,
			seb: !!r.seb,
			sebSeats: r.sebSeats ?? 0,
			hmebSeats: r.hmebSeats ?? 0
		};
	}

	let form: Record<string, any> = $state(room ? pick(room) : { ...empty });

	let saving = $state(false);
	let errorMsg = $state<string | null>(null);

	const nameError = $derived(form.name.trim() === '' ? 'Name ist erforderlich.' : '');
	const seatsError = $derived(!(Number(form.seats) > 0) ? 'Plätze muss eine Zahl > 0 sein.' : '');
	const formValid = $derived(!nameError && !seatsError);

	const FLAGS = [
		{ key: 'handicap', label: 'NTA (Handicap)' },
		{ key: 'lab', label: 'Labor' },
		{ key: 'placesWithSocket', label: 'Steckdosen' },
		{ key: 'exahm', label: 'EXaHM' },
		{ key: 'seb', label: 'SEB' }
	];

	const REQUEST_OPTIONS = [
		{ value: 'NONE', label: 'kein Request' },
		{ value: 'ANNY', label: 'Anny' },
		{ value: 'MANAGEMENT', label: 'Gebäudemanagement' }
	];

	async function submit() {
		if (!formValid) {
			errorMsg = 'Bitte die markierten Eingaben prüfen.';
			return;
		}
		const input: Record<string, any> = {
			name: form.name,
			seats: Number(form.seats),
			handicap: form.handicap,
			lab: form.lab,
			placesWithSocket: form.placesWithSocket,
			requestWith: form.requestWith,
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
		onsaved?.(data);
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

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Anforderung über</span>
			<select class="select select-bordered select-sm" bind:value={form.requestWith}>
				{#each REQUEST_OPTIONS as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
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
		<button class="btn btn-ghost btn-sm" onclick={() => oncancel?.()} disabled={saving}>
			Abbrechen
		</button>
		<WriteButton class="btn btn-primary btn-sm gap-2" onclick={submit} disabled={saving || !formValid}>
			{#if saving}<span class="loading loading-spinner loading-xs"></span>{/if}
			{mode === 'edit' ? 'Speichern' : 'Anlegen'}
		</WriteButton>
	</div>
</div>
