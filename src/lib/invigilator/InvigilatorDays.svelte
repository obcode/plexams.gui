<script>
	export let requirements;

	function bg(day) {
		if (requirements.examDays.includes(day) && requirements.excludedDays.includes(day)) {
			return 'bg-yellow-500';
		}
		if (requirements.excludedDays.includes(day)) {
			return 'bg-red-500';
		}
		if (requirements.examDays.includes(day)) {
			return 'bg-green-500';
		}
	}
</script>

<div class="flex">
	{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as day}
		<div class="border border-black p-1 {bg(day)}">
			{day}
		</div>
	{/each}
</div>
