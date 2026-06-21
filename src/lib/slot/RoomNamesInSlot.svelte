<script>
	/** @type {number} */
	export let day;
	/** @type {number} */
	export let time;
	import { onMount } from 'svelte';

	/** @type {string[]} */
	let roomNames = [];

	async function fetchRoomNames() {
		const response = await fetch('/api/plan/roomNamesInSlot', {
			method: 'POST',
			body: JSON.stringify({ day, time }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		roomNames = data.plannedRoomNamesInSlot.filter((name) => name != 'ONLINE' && name != 'No Room');
	}

	onMount(() => {
		fetchRoomNames();
	});
</script>

{#if roomNames.length > 0}
	<div class="rounded-lg border border-base-300 bg-base-100 p-2 text-center text-sm">
		<div class="badge badge-primary badge-sm">
			{roomNames.length}
			{roomNames.length == 1 ? 'Raum' : 'Räume'}
		</div>
		<ul class="mt-1 text-base-content/70">
			{#each roomNames as roomName}
				<li>{roomName}</li>
			{/each}
		</ul>
	</div>
{/if}
