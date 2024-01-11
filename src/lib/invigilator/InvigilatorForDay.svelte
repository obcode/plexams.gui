<script>
	export let invigilator;
	export let selectedInvigilator;
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	let stillTodo = invigilator.todos.totalMinutes - invigilator.todos.doingMinutes;

	function select(id) {
		if (invigilator.teacher.id != selectedInvigilator) {
			dispatch('selected', {
				selectedInvigilator: id
			});
		} else {
			dispatch('unselected', {
				selectedInvigilator: id
			});
		}
	}

	let selected = false;

	let bg = 'bg-green-300';
	$: {
		if (invigilator.teacher.id == selectedInvigilator) bg = 'bg-blue-400';
		else if (invigilator.todos.enough) {
			bg = 'bg-red-300';
		} else if (stillTodo <= 0) {
			bg = 'bg-yellow-300';
		} else {
			bg = 'bg-green-300';
		}
	}

	function bg2() {
		if (selected) return 'bg-blue-400';
		if (invigilator.todos.enough) {
			return 'bg-red-300';
		}
		if (stillTodo <= 0) {
			return 'bg-yellow-300';
		}
		return 'bg-green-300';
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="w-full border-solid border-2 border-black {bg} mb-2 p-2 rounded-lg shadow-xl text-center"
	on:click={select(invigilator.teacher.id)}
>
	{invigilator.teacher.id}. {invigilator.teacher.shortname}: offen {stillTodo}
	{#if invigilator.todos.invigilationDays.length > 0}
		{#each invigilator.todos.invigilationDays as day}
			<div class="badge m-1">{day}</div>
		{/each}
	{/if}
</div>
