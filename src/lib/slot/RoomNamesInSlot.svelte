<script>
	export let day;
	export let time;
	import { onMount } from 'svelte';

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
		roomNames = data.plannedRoomNamesInSlot;
	}

	onMount(() => {
		fetchRoomNames();
	});
</script>

{#if roomNames.length > 0}
	<div class="border-solid border-2 border-black m-2 p-2 rounded-lg shadow-xl text-center">
		<div class="badge badge-primary">{roomNames.length} Räume</div>
		<ul>
			{#each roomNames as roomName}
				<li>{roomName}</li>
			{/each}
		</ul>
	</div>
{/if}
