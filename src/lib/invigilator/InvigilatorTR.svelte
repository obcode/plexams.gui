<script>
	export let index;
	export let invigilator;

	import InvigilatorDays from './InvigilatorDays.svelte';

	function bg(invigilator) {
		if (!invigilator.requirements) {
			return 'bg-red-400';
		}
		if (invigilator.todos.enough) {
			return 'bg-green-400';
		}
	}
	function bgEnough() {
		if (invigilator.todos.enough) {
			return 'bg-green-400';
		}
	}

	let contribution = 0;
	if (invigilator.requirements) {
		contribution = invigilator.requirements.allContributions;
	}
</script>

<tr>
	<td>{index + 1}</td>
	<td class={bg(invigilator)}>{invigilator.teacher.shortname} ({invigilator.teacher.id})</td>
	<td><InvigilatorDays {invigilator} /></td>
	<td
		>{#if invigilator.requirements.factor != 1}
			{invigilator.requirements.factor}
			({#if invigilator.requirements.partTime != 1}
				Teilzeit {invigilator.requirements.partTime}{/if}
			{#if invigilator.requirements.freeSemester != 0}
				Freisemester {invigilator.requirements
					.freeSemester}{/if}{#if invigilator.requirements.overtimeLastSemester != 0}
				letztes Semester {invigilator.requirements.overtimeLastSemester}{/if}
			{#if invigilator.requirements.overtimeThisSemester != 0}
				dieses Semester {invigilator.requirements.overtimeThisSemester}{/if})
		{/if}
	</td>
	<td>
		{#if contribution > 0}{contribution}{/if}
	</td>
	<td class={bgEnough()}>
		{#if invigilator.todos} {invigilator.todos.totalMinutes} {/if}
	</td>
	<td>
		{#if invigilator.todos.doingMinutes > 0}
			{invigilator.todos.doingMinutes}
		{/if}
	</td>
	<td>{invigilator.todos.totalMinutes - invigilator.todos.doingMinutes}</td>
</tr>
