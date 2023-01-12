<script>
	export let semesterConfig;
	export let day;
	export let time;
	import Room from './Room.svelte';
	import { onMount } from 'svelte';

	let slot;

	let noRooms = true;
	let loading = true;

	async function fetchSlot(day, time) {
		// console.log(`...fetching Slot (${day}, ${time})`);

		const response = await fetch('/api/plan/roomsWithInvigilationsForSlot', {
			method: 'POST',
			body: JSON.stringify({ day, time }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		// console.log(data.plannedExamsInSlot);
		slot = data.roomsWithInvigilationsForSlot;
		noRooms = slot.roomsWithInvigilators.length == 0;
		loading = false;
	}

	// $: if (refresh) {
	// 	fetchSlot(day, time);
	// }
	onMount(() => {
		fetchSlot(day, time.number);
	});
</script>

{#if !loading}
	<div class="border-2 border-black rounded-lg shadow-xl m-2 p-2 text-center">
		<div class="flex justify-between">
			<div class="border-2 border-black rounded-lg shadow-xl bg-green-400 m-2 p-2 text-center">
				Slot {time.number}: {time.start} Uhr
			</div>
			{#if !noRooms}
				<div class="border-2 border-black rounded-lg shadow-xl bg-red-400 m-2 p-2 text-center">
					Reserveaufsicht
				</div>
			{/if}
		</div>
		{#if !noRooms}
			<div class="flex m-2 border-solid border-black  border-2 bg-green-100 rounded-lg shadow-xl">
				{#each slot.roomsWithInvigilators as roomsWithInvigilators}
					<Room {roomsWithInvigilators} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
