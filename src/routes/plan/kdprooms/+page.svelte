<script>
	import { run } from 'svelte/legacy';

	let { data } = $props();
	let slots = data.slots;
	let hideEmpty = $state(true);
	const roomOrder = ['T3.015', 'T3.016', 'T3.017', 'T3.023', 'T3.021'];

	/** Datum aus ISO-String (keine Zeitzonen-/Hydration-Probleme). @param {string} iso */
	const fmtDate = (iso) => {
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
		return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
	};

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
		return roomOrder.map((room) => ({
			room,
			booked: bookedRooms.has(room),
			used: usedRooms.has(room)
		}));
	}

	/** @param {any[]} roomStatuses */
	function getSlotHeaderColor(roomStatuses) {
		if (roomStatuses.some((/** @type {any} */ rs) => rs.used && !rs.booked)) return 'error';
		if (roomStatuses.some((/** @type {any} */ rs) => rs.booked && !rs.used)) return 'warning';
		return 'success';
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
		const m = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/.exec(String(value));
		return m ? m[1] : '--:--';
	}

	/** @type {any[]} */
	let filteredSlots = $state([]);
	run(() => {
		filteredSlots = hideEmpty
			? slots.filter(
					(/** @type {any} */ s) =>
						(s.exams && s.exams.length > 0) ||
						(s.tRooms && s.tRooms.length > 0) ||
						(s.annyBookings && s.annyBookings.length > 0)
				)
			: slots;
	});
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Anny-Anforderungen (KDP)</h1>
		<span class="text-sm text-base-content/60">EXaHM / SEB-Bedarf + Anny-Buchungen</span>
	</div>

	<div class="flex flex-wrap items-center gap-4 rounded-lg border border-base-300 bg-base-100 p-3">
		<label class="label cursor-pointer gap-2">
			<input type="checkbox" class="toggle toggle-sm toggle-primary" bind:checked={hideEmpty} />
			<span class="label-text">nur Slots mit Bedarf</span>
		</label>
		<span class="text-xs text-base-content/50">Wdh. = Wiederholungsprüfung</span>
	</div>

	{#each filteredSlots as slot}
		{@const roomStatuses = buildRoomStatus(slot)}
		{@const color = getSlotHeaderColor(roomStatuses)}
		<div class="collapse-arrow collapse rounded-lg border border-base-300 bg-base-100">
			<input type="checkbox" />
			<div class="collapse-title flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2 font-medium">
					<span
						class="inline-block h-2.5 w-2.5 rounded-full"
						class:bg-error={color === 'error'}
						class:bg-warning={color === 'warning'}
						class:bg-success={color === 'success'}
					></span>
					{#if slot.date}
						{fmtDate(slot.date)}{slot.start ? ` · ${slot.start}` : ''}
					{:else}
						Ungeplant
					{/if}
					<span class="text-sm text-base-content/50">(Tag {slot.day} · Slot {slot.slot})</span>
				</div>
				<div class="flex flex-wrap gap-1">
					{#each roomStatuses as rs}
						<div
							class="rounded border px-2 py-0.5 text-xs {rs.used && rs.booked
								? 'border-success/40 bg-success/10'
								: rs.used && !rs.booked
									? 'border-error/40 bg-error/10'
									: rs.booked && !rs.used
										? 'border-warning/40 bg-warning/10'
										: 'border-base-300 text-base-content/40'}"
							title={rs.used || rs.booked
								? `gebucht: ${rs.booked ? 'ja' : 'nein'} · genutzt: ${rs.used ? 'ja' : 'nein'}`
								: 'frei'}
						>
							{rs.room}
						</div>
					{/each}
				</div>
			</div>
			<div class="collapse-content">
				<div class="grid gap-3 md:grid-cols-4">
					<div class="rounded-lg border border-base-300 bg-base-100 p-3">
						<div class="mb-2 font-medium">Anny-Buchungen</div>
						{#if !slot.annyBookings || slot.annyBookings.length === 0}
							<div class="text-sm text-base-content/50">Keine Buchungen</div>
						{:else}
							<table class="table table-sm">
								<thead><tr><th>Raum</th><th>Zeit</th><th>Beschreibung</th></tr></thead>
								<tbody>
									{#each sortBookingsForDisplay(slot.annyBookings) as b}
										<tr class:opacity-60={b.canceledAt}>
											<td>{b.room || '--'}</td>
											<td class="whitespace-nowrap tabular-nums"
												>{formatBookingTime(b.startDate)}–{formatBookingTime(b.endDate)}</td
											>
											<td>
												<div>{b.description}</div>
												<div class="mt-1 flex items-center gap-1">
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

					<div class="rounded-lg border border-base-300 bg-base-100 p-3">
						<div class="mb-2 font-medium">Verfügbare T-Räume</div>
						{#if slot.tRooms.length === 0}
							<div class="text-sm text-base-content/50">Keine T-Räume</div>
						{:else}
							<table class="table table-sm">
								<thead><tr><th>Raum</th><th class="text-right">Sitze</th></tr></thead>
								<tbody>
									{#each slot.tRooms as r}
										<tr><td>{r.name}</td><td class="text-right tabular-nums">{r.seats}</td></tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>

					<div class="rounded-lg border border-base-300 bg-base-100 p-3 md:col-span-2">
						<div class="mb-2 font-medium">Prüfungen mit EXaHM / SEB-Bedarf</div>
						{#if slot.exams.length === 0}
							<div class="text-sm text-base-content/50">Keine Prüfungen mit Bedarf</div>
						{:else}
							<table class="table table-sm">
								<thead>
									<tr>
										<th>Ancode</th>
										<th>Modul</th>
										<th class="text-right">Anm.</th>
										<th>Bedarf</th>
										<th>Geplanter Raum</th>
									</tr>
								</thead>
								<tbody>
									{#each slot.exams as e}
										<tr>
											<td
												><a class="link" href="/exam/examsToPlan?ancode={e.ancode}">{e.ancode}</a
												></td
											>
											<td>{e.module}</td>
											<td class="text-right tabular-nums">{e.studentRegsCount}</td>
											<td>
												{#if e.wantsExahm}<span class="badge badge-info badge-sm">EXaHM</span>{/if}
												{#if e.wantsSeb}<span class="badge badge-warning badge-sm">SEB</span>{/if}
											</td>
											<td>
												{#if e.plannedRooms.length === 0}
													<span class="text-sm text-base-content/40">—</span>
												{:else}
													{#each e.plannedRooms as pr}
														<div class="whitespace-nowrap">
															{pr.name} ({pr.seats})
															{#if pr.prePlanned}<span class="badge badge-accent badge-sm">pre</span
																>{/if}
															{#if pr.reserve}<span class="badge badge-secondary badge-sm">res</span
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
	{/each}
</div>
