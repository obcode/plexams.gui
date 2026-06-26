<script>
	export let data;
	const slots = data.slots || [];
	const roomOrder = data.roomOrder || [];
	let hideEmpty = true;
	/** @type {number[]} ausgewählte Tage (leer = alle) */
	let selectedDays = [];

	$: availableDays = [...new Set(slots.map((/** @type {any} */ slot) => Number(slot.day)))].sort(
		(a, b) => a - b
	);
	/** @param {number} d */
	const toggleDay = (d) =>
		(selectedDays = selectedDays.includes(d)
			? selectedDays.filter((x) => x !== d)
			: [...selectedDays, d]);

	$: filteredSlots = slots.filter((/** @type {any} */ slot) => {
		const dayMatch = selectedDays.length === 0 || selectedDays.includes(Number(slot.day));
		if (!dayMatch) return false;
		if (!hideEmpty) return true;
		return Number(slot.coveredRooms || 0) > 0;
	});

	/** @param {string | Date | null | undefined} date */
	function fmtDate(date) {
		if (!date) return '--';
		const d = new Date(date);
		if (Number.isNaN(d.getTime())) return date;
		return d.toLocaleDateString('de-DE');
	}

	/** @param {string | Date | null | undefined} value */
	function fmtTime(value) {
		if (!value) return '--:--';
		const raw = String(value);
		const localIsoMatch = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/);
		if (localIsoMatch) return localIsoMatch[1];
		const parsed = new Date(raw);
		if (Number.isNaN(parsed.getTime())) return '--:--';
		return parsed.toLocaleTimeString('de-DE', {
			timeZone: 'Europe/Berlin',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Anny-Buchungen nach Slots</h1>
		<span class="badge badge-primary badge-lg tabular-nums"
			>{filteredSlots.length} / {slots.length}</span
		>
		<span class="text-sm text-base-content/50">T-Räume</span>
	</div>

	<!-- Filter -->
	<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
		<label class="flex cursor-pointer items-center gap-2 text-sm">
			<input type="checkbox" class="toggle toggle-primary toggle-sm" bind:checked={hideEmpty} />
			<span>nur Slots mit T-Raum-Abdeckung</span>
		</label>
		<div class="flex-1"></div>
		<div class="flex flex-wrap items-center gap-1">
			<span class="text-sm text-base-content/50">Tage:</span>
			{#each availableDays as day}
				<button
					class="badge gap-1 tabular-nums {selectedDays.includes(day)
						? 'badge-primary'
						: 'badge-ghost'}"
					on:click={() => toggleDay(day)}
				>
					{day}
				</button>
			{/each}
			{#if selectedDays.length}
				<button class="btn btn-ghost btn-xs" on:click={() => (selectedDays = [])}>alle</button>
			{/if}
		</div>
	</div>

	<!-- Tabelle -->
	<div class="overflow-x-auto rounded-lg border border-base-300">
		<table class="table table-sm">
			<thead>
				<tr>
					<th class="bg-base-200 sticky left-0 z-10">Slot</th>
					{#each roomOrder as room}
						<th class="font-mono">{room}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if filteredSlots.length === 0}
					<tr>
						<td
							colspan={roomOrder.length + 1}
							class="py-8 text-center text-sm text-base-content/50"
						>
							Keine passenden Slots gefunden
						</td>
					</tr>
				{:else}
					{#each filteredSlots as slot}
						<tr class="hover">
							<td class="bg-base-100 sticky left-0 z-10 min-w-[170px] align-top">
								<div class="font-medium tabular-nums">{fmtDate(slot.date)} {slot.start || ''}</div>
								<div class="text-xs text-base-content/50">Tag/Slot {slot.day}/{slot.slot}</div>
								<div class="mt-1">
									<span
										class="badge badge-sm tabular-nums {Number(slot.coveredRooms) > 0
											? 'badge-success'
											: 'badge-ghost'}"
									>
										{slot.coveredRooms} T-Räume belegt
									</span>
								</div>
							</td>
							{#each roomOrder as room}
								<td class="min-w-[230px] align-top">
									{#if (slot.bookingsByRoom[room] || []).length === 0}
										<span class="text-base-content/20">—</span>
									{:else}
										<div class="flex flex-col gap-1.5">
											{#each slot.bookingsByRoom[room] || [] as b}
												<div class="rounded-lg border border-base-300 bg-base-200/40 p-2">
													<div class="text-sm font-medium tabular-nums">
														{fmtTime(b.startDate)} – {fmtTime(b.endDate)}
													</div>
													{#if b.description}
														<div class="mt-0.5 text-xs text-base-content/60">{b.description}</div>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
