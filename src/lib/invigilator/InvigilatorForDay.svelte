<script>
	export let invigilator;

	let stillTodo = invigilator.todos.totalMinutes - invigilator.todos.doingMinutes;

	function bg() {
		if (invigilator.todos.enough) {
			return 'bg-red-300';
		}
		if (stillTodo < 90) {
			return 'bg-yellow-300';
		}
		return 'bg-green-300';
	}
</script>

<div
	class="w-full border-solid border-2 border-black {bg()} mb-2 p-2 rounded-lg shadow-xl text-center"
>
	{invigilator.teacher.id}. {invigilator.teacher.shortname}: offen {stillTodo}
</div>
