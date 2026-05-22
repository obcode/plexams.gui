<script>
	export let data;
	const slots = data.slots || [];
	const roomOrder = data.roomOrder || [];
	let hideEmpty = true;
	/** @type {Array<number | string>} */
	let selectedDays = [];

	$: availableDays = [...new Set(slots.map((slot) => slot.day))].sort((a, b) => a - b);
	$: selectedDayNumbers = selectedDays
		.map((day) => Number(day))
		.filter((day) => Number.isFinite(day));
	$: filteredSlots = slots.filter((slot) => {
		const dayMatch =
			selectedDayNumbers.length === 0 || selectedDayNumbers.includes(Number(slot.day));
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

<div class="text-center m-4 text-3xl uppercase">Anny Buchungen nach Slots (T-Räume)</div>

<div class="flex flex-wrap items-center gap-4 mb-4">
	<label class="label cursor-pointer gap-2">
		<span class="label-text">Nur Slots mit T-Raum-Abdeckung zeigen</span>
		<input type="checkbox" class="toggle toggle-primary" bind:checked={hideEmpty} />
	</label>

	<div class="flex flex-wrap gap-2">
		{#each availableDays as day}
			<label class="label cursor-pointer gap-1">
				<input type="checkbox" class="checkbox checkbox-sm" bind:group={selectedDays} value={day} />
				<span class="label-text">Tag {day}</span>
			</label>
		{/each}
	</div>
</div>

<div class="overflow-x-auto">
	<table class="table table-zebra table-compact w-full">
		<thead>
			<tr>
				<th>Slot</th>
				{#each roomOrder as room}
					<th>{room}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if filteredSlots.length === 0}
				<tr>
					<td colspan={roomOrder.length + 1} class="text-center py-6"
						>Keine passenden Slots gefunden</td
					>
				</tr>
			{:else}
				{#each filteredSlots as slot}
					<tr>
						<td class="align-top min-w-[170px]">
							<div class="font-semibold">{fmtDate(slot.date)} {slot.start || ''}</div>
							<div class="text-xs opacity-70">Tag/Slot: {slot.day}/{slot.slot}</div>
							<div class="text-xs mt-1">T-Räume mit Abdeckung: {slot.coveredRooms}</div>
						</td>
						{#each roomOrder as room}
							<td class="align-top min-w-[230px]">
								{#if (slot.bookingsByRoom[room] || []).length === 0}
									<div class="text-xs opacity-50">-</div>
								{:else}
									<div class="space-y-2">
										{#each slot.bookingsByRoom[room] || [] as b}
											<div class="rounded border p-2 bg-base-100">
												<div class="font-semibold text-sm">
													{fmtTime(b.startDate)} - {fmtTime(b.endDate)}
												</div>
												<div class="text-xs mt-1">{b.description}</div>
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
