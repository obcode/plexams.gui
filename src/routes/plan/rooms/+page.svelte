<script>
	export let data;
	import ExamsForRoomPlanning from '$lib/slot/ExamsForRoomPlanning.svelte';
	import RoomNamesInSlot from '$lib/slot/RoomNamesInSlot.svelte';
	import { mkDate } from '$lib/jshelper/misc';

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
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Raumplanung</div>
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

{#each data.semesterConfig.days as day}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="border-2 border-black rounded-lg shadow-xl bg-green-400 m-2 p-2 text-center"
		on:click={() => (showDays[day.number] = !showDays[day.number])}
	>
		Tag {day.number}: {mkDate(day.date)}
	</div>
	{#if showDays[day.number]}
		{#each data.semesterConfig.starttimes as time}
			<div class="grid grid-cols-12 gap-4">
				<div class="col-span-1">
					<div
						class="border-solid border-2 border-black bg-yellow-400 m-2 p-2 rounded-lg shadow-xl text-center"
					>
						Slot {time.number}: {time.start}
					</div>
					{#if showRooms == 'all'}
						<RoomNamesInSlot day={day.number} time={time.number} />
					{/if}
				</div>
				<div
					class="col-span-11 m-2 border-solid border-black border-2 bg-green-100 rounded-lg shadow-xl"
				>
					<div class="flex justify-start">
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
	{/if}
{/each}
