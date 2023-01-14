<script>
	export let invigilator;

	let stillTodo = invigilator.todos.totalMinutes - invigilator.todos.doingMinutes;

	function bg() {
		if (invigilator.todos.enough) {
			return 'bg-red-300';
		}
		if (stillTodo <= 0) {
			return 'bg-yellow-300';
		}
		return 'bg-green-300';
	}
</script>

<div
	class="w-full border-solid border-2 border-black {bg()} mb-2 p-2 rounded-lg shadow-xl text-center"
>
	{invigilator.teacher.id}. {invigilator.teacher.shortname}: offen {stillTodo}
	{#if invigilator.todos.invigilationDays.length > 0}
		{#each invigilator.todos.invigilationDays as day}
			<div class="badge m-1">{day}</div>
		{/each}
	{/if}
</div>
