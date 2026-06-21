<script>
	import { invalidateAll } from '$app/navigation';

	export let data;

	const FLAGS = ['nta', 'lab', 'placesWithSocket', 'exahm', 'seb', 'needsRequest'];

	/** @type {string | null} aktiver Bool-Filter */
	let filterCol = null;
	/** @type {'name' | 'seats'} */
	let sortCol = 'name';
	/** Aktiv-Status-Filter; Default: nur aktive
	 * @type {'active' | 'all' | 'inactive'} */
	let activeFilter = 'active';

	function cycleActive() {
		activeFilter =
			activeFilter === 'active' ? 'all' : activeFilter === 'all' ? 'inactive' : 'active';
	}
	$: activeLabel =
		activeFilter === 'active' ? 'nur aktive' : activeFilter === 'inactive' ? 'nur inaktive' : 'alle';

	/** @param {string} col */
	function onHeader(col) {
		if (FLAGS.includes(col)) {
			filterCol = filterCol === col ? null : col;
		} else {
			sortCol = /** @type {'name' | 'seats'} */ (col);
		}
	}

	// filterCol/sortCol direkt hier referenzieren, damit Svelte sie als
	// Abhängigkeiten erkennt und die Liste bei jedem Klick neu berechnet.
	$: rooms = [...data.rooms]
		.filter((/** @type {any} */ r) => {
			if (activeFilter === 'active' && r.deactivated) return false;
			if (activeFilter === 'inactive' && !r.deactivated) return false;
			if (!filterCol) return true;
			if (filterCol === 'nta') return r.handicap;
			return r[filterCol];
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
				// aktiv umschalten: neuer active-Wert = aktueller deactivated-Wert
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
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Räume</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.rooms.length}</span>
		{#if rooms.length !== data.rooms.length}
			<span class="text-sm text-base-content/60">{rooms.length} angezeigt</span>
		{/if}
	</div>

	<p class="text-xs text-base-content/50">
		Spaltenköpfe sind klickbar: Name/Plätze sortieren, die übrigen filtern (erneut klicken hebt den
		Filter auf). Eine Deaktivierung wirkt erst beim nächsten Vorbereiten der Räume-für-Slots; bereits
		verplante Räume bleiben.
	</p>

	{#if toggleError}
		<div class="alert alert-error py-2 text-sm"><span>{toggleError}</span></div>
	{/if}

	<div class="overflow-x-auto rounded-lg border border-base-300">
		<table class="table table-zebra table-sm">
			<thead>
				<tr>
					<th
						class="cursor-pointer {sortCol === 'name' ? 'text-primary' : ''}"
						on:click={() => onHeader('name')}>Name</th
					>
					<th
						class="cursor-pointer text-right {sortCol === 'seats' ? 'text-primary' : ''}"
						on:click={() => onHeader('seats')}>Plätze</th
					>
					<th
						class="cursor-pointer {filterCol === 'nta' ? 'text-primary' : ''}"
						on:click={() => onHeader('nta')}>NTA</th
					>
					<th
						class="cursor-pointer {filterCol === 'lab' ? 'text-primary' : ''}"
						on:click={() => onHeader('lab')}>Labor</th
					>
					<th
						class="cursor-pointer {filterCol === 'placesWithSocket' ? 'text-primary' : ''}"
						on:click={() => onHeader('placesWithSocket')}>Steckdosen</th
					>
					<th
						class="cursor-pointer {filterCol === 'exahm' ? 'text-primary' : ''}"
						on:click={() => onHeader('exahm')}>EXaHM</th
					>
					<th
						class="cursor-pointer {filterCol === 'seb' ? 'text-primary' : ''}"
						on:click={() => onHeader('seb')}>SEB</th
					>
					<th
						class="cursor-pointer {filterCol === 'needsRequest' ? 'text-primary' : ''}"
						on:click={() => onHeader('needsRequest')}>Anforderung</th
					>
					<th
						class="cursor-pointer whitespace-nowrap {activeFilter !== 'active' ? 'text-primary' : ''}"
						title="Klicken: nur aktive → alle → nur inaktive"
						on:click={cycleActive}
					>
						aktiv <span class="font-normal text-base-content/50">({activeLabel})</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each rooms as room (room.name)}
					<tr class={room.deactivated ? 'opacity-50' : ''}>
						<td class="font-medium">{room.name}</td>
						<td class="text-right tabular-nums">{room.seats}</td>
						<td>{#if room.handicap}<span class="badge badge-info badge-sm">NTA</span>{/if}</td>
						<td>{#if room.lab}<span class="badge badge-info badge-sm">Labor</span>{/if}</td>
						<td>
							{#if room.placesWithSocket}<span class="badge badge-info badge-sm">Steckdosen</span
								>{/if}
						</td>
						<td>{#if room.exahm}<span class="badge badge-info badge-sm">EXaHM</span>{/if}</td>
						<td>
							{#if room.seb}
								<span class="badge badge-info badge-sm">SEB</span>
								{#if room.sebSeats > 0}<span class="badge badge-sm">{room.sebSeats} SEB</span>{/if}
								{#if room.hmebSeats > 0}<span class="badge badge-sm">{room.hmebSeats} HMEB</span>{/if}
							{/if}
						</td>
						<td>
							{#if room.needsRequest}<span class="badge badge-warning badge-sm">Request</span>{/if}
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
