<script lang="ts">
	let {
		invigilator,
		selectedInvigilator,
		onselected,
		onunselected
	}: {
		invigilator: any;
		selectedInvigilator: any;
		onselected?: (detail: { selectedInvigilator: any }) => void;
		onunselected?: (detail: { selectedInvigilator: any }) => void;
	} = $props();

	const stillTodo = $derived(invigilator.todos.totalMinutes - invigilator.todos.doingMinutes);

	function select(id: any) {
		if (invigilator.teacher.id != selectedInvigilator) {
			onselected?.({ selectedInvigilator: id });
		} else {
			onunselected?.({ selectedInvigilator: id });
		}
	}

	const bg = $derived.by(() => {
		if (invigilator.teacher.id == selectedInvigilator) return 'bg-blue-400';
		if (invigilator.todos.enough) return 'bg-red-300';
		if (stillTodo <= 0) return 'bg-yellow-300';
		return 'bg-green-300';
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="w-full border-solid border-2 border-black {bg} mb-2 p-2 rounded-lg shadow-xl text-center"
	onclick={() => select(invigilator.teacher.id)}
>
	<div class="flex justify-between">
		{invigilator.teacher.id}. {invigilator.teacher.shortname}: offen
		<div class="badge badge-primary m-1">{stillTodo}</div>
	</div>
	<div class="flex justify-between">
		<div>
			{#if invigilator.requirements && invigilator.requirements.examDays && invigilator.requirements.examDays.length > 0}
				{#each invigilator.requirements.examDays as day}
					<div class="badge badge-success m-1">{day}</div>
				{/each}
			{/if}
		</div>
		<div>
			{#if invigilator.todos.invigilationDays.length > 0}
				{#each invigilator.todos.invigilationDays as day}
					<div class="badge badge-info m-1">{day}</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
