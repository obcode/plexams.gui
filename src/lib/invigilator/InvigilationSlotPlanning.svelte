<script lang="ts">
	import Room from './Room.svelte';
	import { onMount } from 'svelte';

	let {
		time,
		starttime,
		details,
		selectedInvigilator
	}: { time: any; starttime: string; details: boolean; selectedInvigilator: any } = $props();

	let slot = $state<any>(undefined);
	let noRooms = $state(true);
	let loading = $state(true);

	async function fetchSlot(starttime: string) {
		const response = await fetch('/api/plan/roomsWithInvigilationsAt', {
			method: 'POST',
			body: JSON.stringify({ starttime }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		slot = data.roomsWithInvigilationsAt;
		noRooms = !slot || !slot.roomsWithInvigilators || slot.roomsWithInvigilators.length == 0;
		loading = false;
	}

	const bgSlot = $derived.by(() => {
		if (slot && slot.reserve) {
			return slot.reserve.id == selectedInvigilator ? 'bg-blue-400' : 'bg-green-300';
		}
		return slot ? 'bg-red-300' : '';
	});

	onMount(() => {
		fetchSlot(starttime);
	});
</script>

{#if !loading}
	<div class="border-2 border-black {bgSlot} rounded-lg shadow-xl m-4 p-2 text-center">
		<div class="flex justify-between">
			<div class="border-2 border-black rounded-lg shadow-xl bg-green-400 m-2 p-2 text-center">
				{time.start.slice(0, 5)} Uhr
			</div>
			{#if !noRooms}
				{#if slot.reserve}
					<div class="border-2 border-black rounded-lg shadow-xl bg-yellow-300 m-2 p-2 text-center">
						{slot.reserve.id}. {slot.reserve.shortname} (Reserve)
					</div>
				{:else}
					<div class="border-2 border-black rounded-lg shadow-xl bg-red-400 m-2 p-2 text-center">
						Reserveaufsicht
					</div>
				{/if}
			{/if}
		</div>
		{#if !noRooms}
			<div
				class="m-2 grid grid-cols-1 rounded-lg border-2 border-solid border-base-300 bg-success/10 shadow-xl sm:grid-cols-3 lg:grid-cols-5"
			>
				{#each slot.roomsWithInvigilators as roomsWithInvigilators}
					<Room {roomsWithInvigilators} {details} {selectedInvigilator} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
