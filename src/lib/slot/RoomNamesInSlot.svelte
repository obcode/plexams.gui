<script lang="ts">
	import { onMount } from 'svelte';

	let { starttime }: { starttime: string } = $props();

	let roomNames = $state<string[]>([]);

	async function fetchRoomNames() {
		const response = await fetch('/api/plan/roomNamesInSlot', {
			method: 'POST',
			body: JSON.stringify({ starttime }),
			headers: { 'content-type': 'application/json' }
		});
		const data = await response.json();
		roomNames = (data.plannedRoomNamesAt ?? []).filter((name: string) => name != 'ONLINE');
	}

	onMount(fetchRoomNames);
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
