<script>
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import RoomForm from '$lib/room/RoomForm.svelte';

	let { data } = $props();

	// Modal zum Anlegen/Bearbeiten
	let showModal = $state(false);
	/** @type {any} */
	let editRoom = $state(null);
	function openAdd() {
		editRoom = null;
		showModal = true;
	}
	/** @param {any} room */
	function openEdit(room) {
		editRoom = room;
		showModal = true;
	}
	async function onSaved() {
		showModal = false;
		await invalidateAll();
	}

	// Eigenschaften eines Raums (Feldname → Anzeige); dienen als Badges UND als
	// Filter-Chips.
	const FEATURES = [
		{ key: 'handicap', label: 'NTA' },
		{ key: 'lab', label: 'Labor' },
		{ key: 'placesWithSocket', label: 'Steckdosen' },
		{ key: 'exahm', label: 'EXaHM' },
		{ key: 'seb', label: 'SEB' }
	];

	// Anforderungstyp (requestWith): Anzeige-Label + Filter
	/** @type {Record<string, string>} */
	const REQUEST_LABEL = { ANNY: 'Anny', MANAGEMENT: 'Gebäudemanagement' };
	const REQUEST_OPTIONS = [
		{ value: 'all', label: 'alle Anforderungen' },
		{ value: 'NONE', label: 'ohne Request' },
		{ value: 'ANNY', label: 'Anny' },
		{ value: 'MANAGEMENT', label: 'Gebäudemanagement' }
	];
	let requestFilter = $state('all');

	/** aktive Eigenschafts-Filter (UND-Verknüpfung)
	 * @type {Set<string>} */
	let activeFlags = $state(new Set());
	/** @param {string} key */
	function toggleFlag(key) {
		if (activeFlags.has(key)) activeFlags.delete(key);
		else activeFlags.add(key);
		activeFlags = new Set(activeFlags); // neue Referenz → Reaktivität
	}

	/** @type {'active' | 'all' | 'inactive'} */
	let activeFilter = $state('active');
	/** @type {'name' | 'seats'} */
	let sortCol = $state('name');

	let rooms = $derived(
		[...data.rooms]
			.filter((/** @type {any} */ r) => {
				if (activeFilter === 'active' && r.deactivated) return false;
				if (activeFilter === 'inactive' && !r.deactivated) return false;
				if (requestFilter !== 'all' && r.requestWith !== requestFilter) return false;
				for (const k of activeFlags) if (!r[k]) return false;
				return true;
			})
			.sort((/** @type {any} */ a, /** @type {any} */ b) =>
				sortCol === 'seats' ? b.seats - a.seats : a.name.localeCompare(b.name)
			)
	);

	/** @type {string | null} */
	let toggleError = $state(null);
	/** @param {any} room */
	async function toggleRoom(room) {
		toggleError = null;
		try {
			const res = await fetch('/api/setRoomActive', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: room.name, active: !!room.deactivated })
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

	const ACTIVE_OPTIONS = [
		{ key: 'active', label: 'nur aktive' },
		{ key: 'all', label: 'alle' },
		{ key: 'inactive', label: 'nur inaktive' }
	];
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Räume</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.rooms.length}</span>
		{#if rooms.length !== data.rooms.length}
			<span class="text-sm text-base-content/60">{rooms.length} angezeigt</span>
		{/if}
		<div class="flex-1"></div>
		<button class="btn btn-primary btn-sm gap-2" onclick={openAdd}>+ Neuer Raum</button>
	</div>

	<!-- Filter-Toolbar -->
	<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="join">
			{#each ACTIVE_OPTIONS as opt}
				<button
					class="btn btn-sm join-item {activeFilter === opt.key ? 'btn-primary' : 'btn-ghost'}"
					onclick={() => (activeFilter = /** @type {any} */ (opt.key))}
				>
					{opt.label}
				</button>
			{/each}
		</div>

		<div class="h-6 w-px bg-base-300"></div>

		<span class="text-xs text-base-content/50">Eigenschaften:</span>
		{#each FEATURES as f}
			<button
				class="btn btn-sm {activeFlags.has(f.key) ? 'btn-primary' : 'btn-outline'}"
				onclick={() => toggleFlag(f.key)}
			>
				{f.label}
			</button>
		{/each}
		{#if activeFlags.size}
			<button class="btn btn-ghost btn-sm" onclick={() => (activeFlags = new Set())}>
				Filter zurücksetzen
			</button>
		{/if}

		<div class="h-6 w-px bg-base-300"></div>

		<select class="select select-bordered select-sm" bind:value={requestFilter}>
			{#each REQUEST_OPTIONS as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>

	<p class="text-xs text-base-content/50">
		Eine Deaktivierung wirkt erst beim nächsten Vorbereiten der Räume-für-Slots; bereits verplante
		Räume bleiben.
	</p>

	{#if toggleError}
		<div class="alert alert-error py-2 text-sm"><span>{toggleError}</span></div>
	{/if}

	<div class="overflow-x-auto rounded-lg border border-base-300">
		<table class="table table-zebra table-sm">
			<thead>
				<tr>
					<th
						class="cursor-pointer select-none {sortCol === 'name' ? 'text-primary' : ''}"
						onclick={() => (sortCol = 'name')}
					>
						Name {sortCol === 'name' ? '▲' : ''}
					</th>
					<th
						class="cursor-pointer select-none text-right {sortCol === 'seats'
							? 'text-primary'
							: ''}"
						onclick={() => (sortCol = 'seats')}
					>
						Plätze {sortCol === 'seats' ? '▼' : ''}
					</th>
					<th>Eigenschaften</th>
					<th>aktiv</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each rooms as room (room.name)}
					<tr class={room.deactivated ? 'opacity-50' : ''}>
						<td class="font-medium">{room.name}</td>
						<td class="text-right tabular-nums">{room.seats}</td>
						<td>
							<div class="flex flex-wrap gap-1">
								{#if room.handicap}<span class="badge badge-info badge-sm">NTA</span>{/if}
								{#if room.lab}<span class="badge badge-info badge-sm">Labor</span>{/if}
								{#if room.placesWithSocket}<span class="badge badge-info badge-sm">Steckdosen</span
									>{/if}
								{#if room.exahm}<span class="badge badge-info badge-sm">EXaHM</span>{/if}
								{#if room.seb}
									<span class="badge badge-info badge-sm">SEB</span>
									{#if room.sebSeats > 0}<span class="badge badge-ghost badge-sm"
											>{room.sebSeats} SEB</span
										>{/if}
									{#if room.hmebSeats > 0}<span class="badge badge-ghost badge-sm"
											>{room.hmebSeats} HMEB</span
										>{/if}
								{/if}
								{#if REQUEST_LABEL[room.requestWith]}<span class="badge badge-warning badge-sm"
										>{REQUEST_LABEL[room.requestWith]}</span
									>{/if}
							</div>
						</td>
						<td>
							<label
								class="label cursor-pointer justify-start gap-2 px-0"
								title="Deaktivierung wirkt erst beim nächsten Vorbereiten der Räume-für-Slots"
							>
								<input
									type="checkbox"
									class="toggle toggle-sm toggle-success"
									checked={!room.deactivated}
									disabled={page.data?.readOnly}
									onchange={() => toggleRoom(room)}
								/>
								<span class="text-xs {room.deactivated ? 'text-error' : 'text-success'}">
									{room.deactivated ? 'inaktiv' : 'aktiv'}
								</span>
							</label>
						</td>
						<td>
							<button class="btn btn-ghost btn-xs" onclick={() => openEdit(room)}
								>✎ Bearbeiten</button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if showModal}
		<div class="modal modal-open" transition:fade>
			<div class="modal-box max-w-2xl">
				<h3 class="mb-4 text-lg font-semibold">
					{editRoom ? `Raum bearbeiten: ${editRoom.name}` : 'Neuer Raum'}
				</h3>
				<RoomForm
					mode={editRoom ? 'edit' : 'add'}
					room={editRoom}
					onsaved={onSaved}
					oncancel={() => (showModal = false)}
				/>
			</div>
			<button class="modal-backdrop" aria-label="Schließen" onclick={() => (showModal = false)}
			></button>
		</div>
	{/if}
</div>
