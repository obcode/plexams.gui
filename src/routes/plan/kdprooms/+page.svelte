<script>
	export let data;
	let slots = data.slots;
	let hideEmpty = true;
	const roomOrder = ['T3.015', 'T3.016', 'T3.017', 'T3.023', 'T3.021'];

	/** @param {any} slot */
	function buildRoomStatus(slot) {
		const bookedRooms = new Set(
			(slot.annyBookings || [])
				.filter((/** @type {any} */ b) => !b.canceledAt && b.room)
				.map((/** @type {any} */ b) => b.room)
		);
		const usedRooms = new Set(
			(slot.exams || []).flatMap((/** @type {any} */ e) =>
				(e.plannedRooms || []).map((/** @type {any} */ pr) => pr.name).filter(Boolean)
			)
		);

		return roomOrder.map((room) => {
			const booked = bookedRooms.has(room);
			const used = usedRooms.has(room);
			return { room, booked, used };
		});
	}

	/** @param {any[]} roomStatuses */
	function getSlotHeaderColor(roomStatuses) {
		const hasRed = roomStatuses.some((/** @type {any} */ rs) => rs.used && !rs.booked);
		if (hasRed) return 'red';
		const hasYellow = roomStatuses.some((/** @type {any} */ rs) => rs.booked && !rs.used);
		if (hasYellow) return 'yellow';
		return 'green';
	}

	/** @param {any[]} bookings */
	function sortBookingsForDisplay(bookings) {
		const roomIndex = new Map(roomOrder.map((r, i) => [r, i]));
		return [...(bookings || [])].sort((a, b) => {
			const ai = roomIndex.get(a.room) ?? 999;
			const bi = roomIndex.get(b.room) ?? 999;
			if (ai !== bi) return ai - bi;
			return String(a.startDate || '').localeCompare(String(b.startDate || ''));
		});
	}

	/** @param {any} value */
	function formatBookingTime(value) {
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

	/** @type {any[]} */
	let filteredSlots = [];
	$: {
		// Wenn der Toggle aktiv ist, zeige Slots mit Prüfungsbedarf, Buchungen oder verfügbaren T-Räumen
		filteredSlots = hideEmpty
			? slots.filter(
					(s) =>
						(s.exams && s.exams.length > 0) ||
						(s.tRooms && s.tRooms.length > 0) ||
						(s.annyBookings && s.annyBookings.length > 0)
				)
			: slots;
	}
</script>

<div class="text-center m-4 text-3xl uppercase">
	KDP Räume Übersicht (EXaHM / SEB Bedarf + Anny)
</div>

<div class="flex items-center gap-4 mb-4">
	<label class="label cursor-pointer gap-2">
		<span class="label-text">Nur Slots mit Bedarf zeigen</span>
		<input type="checkbox" class="toggle toggle-primary" bind:checked={hideEmpty} />
	</label>
	<div class="badge badge-warning">Wdh. = Wiederholungsprüfung</div>
</div>

{#each filteredSlots as slot}
	{@const roomStatuses = buildRoomStatus(slot)}
	{@const slotHeaderColor = getSlotHeaderColor(roomStatuses)}
	<div class="collapse bg-base-200 mb-2">
		<input type="checkbox" />
		<div
			class="collapse-title text-xl font-medium flex justify-between"
			class:bg-red-200={slotHeaderColor === 'red'}
			class:bg-yellow-200={slotHeaderColor === 'yellow'}
			class:bg-green-200={slotHeaderColor === 'green'}
		>
			<div>
				{#if slot.date}
					{new Date(slot.date).toLocaleDateString()} {slot.start ? ` ${slot.start}` : ''}
				{:else}
					Ungeplant
				{/if}
				<span class="text-sm text-gray-500"> ({slot.day}/{slot.slot})</span>
			</div>
			<div class="text-sm opacity-90 flex items-center gap-3">
				<div class="grid grid-cols-5 gap-2">
					{#each roomStatuses as rs}
						<div
							class="rounded border px-2 py-1 min-w-[120px]"
							class:bg-yellow-100={rs.booked && !rs.used}
							class:border-yellow-400={rs.booked && !rs.used}
							class:bg-red-100={rs.used && !rs.booked}
							class:border-red-400={rs.used && !rs.booked}
							class:bg-green-100={rs.used && rs.booked}
							class:border-green-400={rs.used && rs.booked}
							class:bg-base-100={!rs.used && !rs.booked}
						>
							<div class="font-semibold leading-tight">{rs.room}</div>
							{#if rs.booked || rs.used}
								<div class="text-xs leading-tight">gebucht: {rs.booked ? 'ja' : 'nein'}</div>
								<div class="text-xs leading-tight">genutzt: {rs.used ? 'ja' : 'nein'}</div>
							{:else}
								<div class="h-8"></div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
		<div class="collapse-content">
			<div class="grid md:grid-cols-4 gap-4">
				<div class="card bg-base-100 shadow">
					<div class="card-body p-4">
						<h2 class="card-title">Anny Buchungen</h2>
						{#if !slot.annyBookings || slot.annyBookings.length === 0}
							<div class="text-sm">Keine Buchungen</div>
						{:else}
							<table class="table table-compact w-full">
								<thead><tr><th>Raum</th><th>Zeit</th><th>Beschreibung</th></tr></thead>
								<tbody>
									{#each sortBookingsForDisplay(slot.annyBookings) as b}
										<tr class:opacity-60={b.canceledAt}>
											<td>{b.room || '--'}</td>
											<td>{formatBookingTime(b.startDate)} - {formatBookingTime(b.endDate)}</td>
											<td>
												<div>{b.description}</div>
												<div class="flex items-center gap-1 mt-1">
													{#if b.isBlocker}<span class="badge badge-neutral badge-sm">Blocker</span
														>{/if}
													<span class="badge badge-outline badge-sm">{b.status}</span>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
				</div>
				<div class="card bg-base-100 shadow">
					<div class="card-body p-4">
						<h2 class="card-title">Verfügbare T-Räume</h2>
						{#if slot.tRooms.length === 0}
							<div class="text-sm">Keine T-Räume</div>
						{:else}
							<table class="table table-compact w-full">
								<thead><tr><th>Raum</th><th>Sitze</th></tr></thead>
								<tbody>
									{#each slot.tRooms as r}
										<tr><td>{r.name}</td><td>{r.seats}</td></tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
				</div>
				<div class="card bg-base-100 shadow md:col-span-2">
					<div class="card-body p-4">
						<h2 class="card-title">Prüfungen mit EXaHM / SEB Bedarf</h2>
						{#if slot.exams.length === 0}
							<div class="text-sm">Keine Prüfungen mit Bedarf</div>
						{:else}
							<table class="table table-compact w-full">
								<thead>
									<tr>
										<th>Ancode</th>
										<th>Modul</th>
										<th>Anmeldungen</th>
										<th>Bedarf</th>
										<th>Geplanter Raum</th>
									</tr>
								</thead>
								<tbody>
									{#each slot.exams as e}
										<tr>
											<td><a class="link" href="/exam/constraints/{e.ancode}">{e.ancode}</a></td>
											<td>{e.module}</td>
											<td>{e.studentRegsCount}</td>
											<td>
												{#if e.wantsExahm}<div class="badge badge-info">EXaHM</div>{/if}
												{#if e.wantsSeb}<div class="badge badge-warning">SEB</div>{/if}
											</td>
											<td>
												{#if e.plannedRooms.length === 0}
													<div class="text-sm">--</div>
												{:else}
													{#each e.plannedRooms as pr}
														<div>
															{pr.name} ({pr.seats})
															{#if pr.prePlanned}<span class="badge badge-accent ml-1">pre</span
																>{/if}
															{#if pr.reserve}<span class="badge badge-secondary ml-1">res</span
																>{/if}
														</div>
													{/each}
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/each}
