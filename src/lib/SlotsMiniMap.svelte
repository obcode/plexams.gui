<script>
	export let slots;
	export let planned = {
		dayNumber: null,
		slotNumber: null
	};

	let plan = new Map();

	let days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	let times = [1, 2, 3, 4, 5, 6];

	for (let i of days) {
		for (let j of times) {
			plan[[i, j]] = 'bg-red-500';
		}
	}

	for (const slot of slots) {
		plan[[slot.dayNumber, slot.slotNumber]] = 'bg-green-500';
	}
</script>

<table>
	{#each times as time}
		<tr>
			{#each days as day}
				<td>
					{#if planned.dayNumber == day && planned.slotNumber == time}
						<span class="m-1 {plan[[day, time]]}">
							<span class="m-2 bg-yellow-200">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									class="inline-block w-4 h-4 stroke-current"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/></svg
								>
							</span>
							<!-- &nbsp;&nbsp;&nbsp;&nbsp; -->
						</span>
					{:else}
						<span class="m-1 {plan[[day, time]]}">
							({day},{time})
							<!-- &nbsp;&nbsp;&nbsp;&nbsp; -->
						</span>
					{/if}
				</td>
			{/each}
		</tr>
	{/each}
</table>
