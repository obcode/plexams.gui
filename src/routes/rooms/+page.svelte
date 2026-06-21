<script>
	import { invalidateAll } from '$app/navigation';

	export let data;

	// Eigenschaften eines Raums (Feldname → Anzeige); dienen als Badges UND als
	// Filter-Chips.
	const FEATURES = [
		{ key: 'handicap', label: 'NTA' },
		{ key: 'lab', label: 'Labor' },
		{ key: 'placesWithSocket', label: 'Steckdosen' },
		{ key: 'exahm', label: 'EXaHM' },
		{ key: 'seb', label: 'SEB' },
		{ key: 'needsRequest', label: 'Anforderung' }
	];

	/** aktive Eigenschafts-Filter (UND-Verknüpfung)
	 * @type {Set<string>} */
	let activeFlags = new Set();
	/** @param {string} key */
	function toggleFlag(key) {
		if (activeFlags.has(key)) activeFlags.delete(key);
		else activeFlags.add(key);
		activeFlags = new Set(activeFlags); // neue Referenz → Reaktivität
	}

	/** @type {'active' | 'all' | 'inactive'} */
	let activeFilter = 'active';
	/** @type {'name' | 'seats'} */
	let sortCol = 'name';

	$: rooms = [...data.rooms]
		.filter((/** @type {any} */ r) => {
			if (activeFilter === 'active' && r.deactivated) return false;
			if (activeFilter === 'inactive' && !r.deactivated) return false;
			for (const k of activeFlags) if (!r[k]) return false;
			return true;
		})
		.sort((/** @type {any} */ a, /** @type {any} */ b) =>
			sortCol === 'seats' ? b.seats - a.seats : a.name.localeCompare(b.name)
		);

	/** @type {string | null} */
	let toggleError = null;
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
	</div>

	<!-- Filter-Toolbar -->
	<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="join">
			{#each ACTIVE_OPTIONS as opt}
				<button
					class="btn btn-sm join-item {activeFilter === opt.key ? 'btn-primary' : 'btn-ghost'}"
					on:click={() => (activeFilter = /** @type {any} */ (opt.key))}
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
				on:click={() => toggleFlag(f.key)}
			>
				{f.label}
			</button>
		{/each}
		{#if activeFlags.size}
			<button class="btn btn-ghost btn-sm" on:click={() => (activeFlags = new Set())}>
				Filter zurücksetzen
			</button>
		{/if}
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
						on:click={() => (sortCol = 'name')}
					>
						Name {sortCol === 'name' ? '▲' : ''}
					</th>
					<th
						class="cursor-pointer select-none text-right {sortCol === 'seats' ? 'text-primary' : ''}"
						on:click={() => (sortCol = 'seats')}
					>
						Plätze {sortCol === 'seats' ? '▼' : ''}
					</th>
					<th>Eigenschaften</th>
					<th>aktiv</th>
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
								{#if room.needsRequest}<span class="badge badge-warning badge-sm">Anforderung</span
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
									on:change={() => toggleRoom(room)}
								/>
								<span class="text-xs {room.deactivated ? 'text-error' : 'text-success'}">
									{room.deactivated ? 'inaktiv' : 'aktiv'}
								</span>
							</label>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
