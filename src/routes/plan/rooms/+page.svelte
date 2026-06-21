<script>
	export let data;
	import ExamsForRoomPlanning from '$lib/slot/ExamsForRoomPlanning.svelte';
	import RoomNamesInSlot from '$lib/slot/RoomNamesInSlot.svelte';
	import { mkDate, mkDateShort } from '$lib/jshelper/misc';
	import { slide } from 'svelte/transition';

	/** @type {'exams' | 'rooms'} */
	let view = 'exams';

	let showOnlyExamsWithNTAs = false;
	let details = false;
	let showRooms = 'all';

	// aufgeklappte Tage (Sicht „nach Prüfungen")
	/** @type {Record<number, boolean>} */
	let showDays = {};
	let showAllDays = false;
	$: for (const day of data.semesterConfig.days) showDays[day.number] = showAllDays;

	/** @param {number} day @param {number} slot @param {string} roomName */
	const isPlanned = (day, slot, roomName) =>
		data.plannedRooms.has(`${day}-${slot}-${roomName}`);

	$: gridRooms =
		showRooms === 'all' ? data.plannedRoomNames : data.plannedRoomNames.filter((/** @type {string} */ r) => r === showRooms);
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Raumplanung</h1>
		<div class="flex-1"></div>
		<div role="tablist" class="tabs tabs-boxed">
			<button
				role="tab"
				class="tab {view === 'exams' ? 'tab-active' : ''}"
				on:click={() => (view = 'exams')}>nach Prüfungen</button
			>
			<button
				role="tab"
				class="tab {view === 'rooms' ? 'tab-active' : ''}"
				on:click={() => (view = 'rooms')}>nach Räumen</button
			>
		</div>
	</div>

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-4 rounded-lg border border-base-300 bg-base-100 p-3">
		<select class="select select-bordered select-sm w-56" bind:value={showRooms}>
			<option value="all">Alle Räume</option>
			{#each data.plannedRoomNames as plannedRoomName}
				<option>{plannedRoomName}</option>
			{/each}
		</select>
		{#if view === 'exams'}
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={showAllDays} />
				<span class="label-text">alle Tage</span>
			</label>
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={showOnlyExamsWithNTAs} />
				<span class="label-text">nur mit NTAs</span>
			</label>
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={details} />
				<span class="label-text">NTA-Details</span>
			</label>
		{/if}
	</div>

	<!-- ============== nach Prüfungen ============== -->
	{#if view === 'exams'}
		<div class="flex flex-col gap-2">
			{#each data.semesterConfig.days as day}
				<div class="overflow-hidden rounded-lg border border-base-300 bg-base-100">
					<button
						class="flex w-full items-center gap-2 px-4 py-2 text-left font-medium hover:bg-base-200"
						on:click={() => (showDays[day.number] = !showDays[day.number])}
					>
						<span class="text-base-content/50">{showDays[day.number] ? '▾' : '▸'}</span>
						Tag {day.number}
						<span class="text-sm font-normal text-base-content/50">{mkDate(day.date)}</span>
					</button>
					{#if showDays[day.number]}
						<div class="flex flex-col gap-3 border-t border-base-300 p-3" transition:slide>
							{#each data.semesterConfig.starttimes as time}
								<div class="grid grid-cols-12 gap-3">
									<div class="col-span-12 flex flex-col gap-2 sm:col-span-2">
										<div class="rounded-lg border border-base-300 bg-base-200 px-3 py-2 text-sm">
											<div class="font-semibold">Slot {time.number}</div>
											<div class="text-xs text-base-content/60">{time.start}</div>
										</div>
										{#if showRooms === 'all'}
											<RoomNamesInSlot day={day.number} time={time.number} />
										{/if}
									</div>
									<div class="col-span-12 sm:col-span-10">
										<div class="flex flex-wrap gap-2">
											<ExamsForRoomPlanning
												day={day.number}
												time={time.number}
												{showOnlyExamsWithNTAs}
												{details}
												{showRooms}
											/>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- ============== nach Räumen ============== -->
	{:else}
		<p class="text-xs text-base-content/50">
			Übersicht, in welchen Slots ein Raum eingeplant ist (Zahl = Slot-Nummer).
		</p>
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-zebra table-sm">
				<thead>
					<tr>
						<th class="sticky left-0 bg-base-200">Raum</th>
						{#each data.semesterConfig.days as day}
							<th class="text-center whitespace-nowrap">
								Tag {day.number}<br /><span class="font-normal text-base-content/50"
									>{mkDateShort(day.date)}</span
								>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each gridRooms as roomName}
						<tr>
							<td class="sticky left-0 bg-base-100 font-medium">{roomName}</td>
							{#each data.semesterConfig.days as day}
								<td>
									<div class="flex gap-0.5">
										{#each data.semesterConfig.starttimes as slot}
											{@const planned = isPlanned(day.number, slot.number, roomName)}
											<div
												class="flex h-5 w-5 items-center justify-center rounded text-[10px] {planned
													? 'bg-primary font-semibold text-primary-content'
													: 'bg-base-200 text-base-content/30'}"
												title="Tag {day.number} · Slot {slot.number}{planned ? ' · geplant' : ''}"
											>
												{slot.number}
											</div>
										{/each}
									</div>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
