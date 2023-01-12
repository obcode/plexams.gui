<script>
	export let roomsWithInvigilators;
	console.log(roomsWithInvigilators);

	function bg() {
		if (roomsWithInvigilators.invigilator) return 'bg-green-300';
		return 'bg-red-400';
	}
</script>

<div class="card lg:card-side {bg()} shadow-xl m-2 border-2 border-black rounded-lg">
	<div class="card-body">
		<h2 class="card-title">{roomsWithInvigilators.name}</h2>
		{#each roomsWithInvigilators.rooms as room}
			<div>{room.seatsPlanned} Studierende, {room.duration} Min.</div>
		{/each}
		{#if roomsWithInvigilators.invigilator}
			<div>{roomsWithInvigilators.invigilator.shortname}</div>
		{/if}
	</div>
</div>
