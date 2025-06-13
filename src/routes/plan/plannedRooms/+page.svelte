<script>
	export let data;
	import ExamsForRoomPlanning from '$lib/slot/ExamsForRoomPlanning.svelte';
	import RoomNamesInSlot from '$lib/slot/RoomNamesInSlot.svelte';
	import { mkDateShort } from '$lib/jshelper/misc';

	let showOnlyExamsWithNTAs = false;
	let details = false;

	let showRooms = 'all';

	let showDays = new Map();

	for (let day of data.semesterConfig.days) {
		showDays[day.number] = false;
	}

	let showAllDays = false;

	$: if (showAllDays) {
		for (let day of data.semesterConfig.days) {
			showDays[day.number] = true;
		}
	} else {
		for (let day of data.semesterConfig.days) {
			showDays[day.number] = false;
		}
	}

	console.log('Planned Rooms Set:', data.plannedRooms);

	function roomPlanned(day, slot, roomName) {
		const entry = `${day}-${slot}-${roomName}`;
		console.log('Checking if room is planned:', entry);
		return data.plannedRooms.has(entry);
	}

	function bg(day, slot, roomName) {
		if (roomPlanned(day.number, slot, roomName)) {
			return 'border border-black bg-green-500';
		} else {
			return '';
		}
	}
	function showSlotNumber(day, slot, roomName) {
		if (roomPlanned(day.number, slot, roomName)) {
			return slot;
		} else {
			return '';
		}
	}
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Geplante Räume</div>
</div>

<div class="flex">
	<select class="select select-primary w-full max-w-xs my-2" bind:value={showRooms}>
		<option selected value="all">Alle Räume</option>
		{#each data.plannedRoomNames as plannedRoomName}
			<option>{plannedRoomName}</option>
		{/each}
	</select>
	<div class="form-control m-3">
		<label class="label cursor-pointer">
			<span class="label-text">Alle Tage anzeigen</span>
			<input
				type="checkbox"
				class="toggle mx-3"
				on:click={() => {
					showAllDays = !showAllDays;
				}}
			/>
		</label>
	</div>
</div>

<div class="overflow-x-auto">
	<table class="table table-bordered table-zebra w-full">
		<thead>
			<tr>
				<th>Raum</th>
				{#each data.semesterConfig.days as day}
					<th>Tag {day.number}<br />{mkDateShort(day.date)}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.plannedRoomNames as roomName}
				<tr>
					<td class="font-semibold">{roomName}</td>
					{#each data.semesterConfig.days as day}
						<td>
							<div class="flex">
								{#each data.semesterConfig.starttimes as slot}
									<div class="p-1 w-5 {bg(day, slot.number, roomName)}">
										{showSlotNumber(day, slot.number, roomName)}
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
