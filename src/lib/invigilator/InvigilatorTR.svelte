<script>
	export let semesterConfig;
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

	let openMinutes = 0;
	$: openMinutes = invigilator.todos.totalMinutes - invigilator.todos.doingMinutes;

	function bgOpenMinutes() {
		if (openMinutes <= 0) {
			return 'bg-green-400';
		}
		if (openMinutes < 60) {
			return 'bg-yellow-400';
		}
		if (openMinutes > 600) {
			return 'bg-red-600';
		}
		if (openMinutes > 500) {
			return 'bg-red-500';
		}
		if (openMinutes > 400) {
			return 'bg-red-400';
		}
		if (openMinutes > 300) {
			return 'bg-red-300';
		}
		if (openMinutes > 200) {
			return 'bg-red-200';
		}
		if (openMinutes > 100) {
			return 'bg-red-100';
		}
	}
</script>

<tr>
	<td>{index + 1}</td>
	<td class={bg(invigilator)}>{invigilator.teacher.shortname} ({invigilator.teacher.id})</td>
	<td><InvigilatorDays {semesterConfig} {invigilator} /></td>
	{#if invigilator.requirements}
		<td>
			{#if invigilator.requirements.factor != 1}
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
		<td class={bgOpenMinutes()}>{openMinutes}</td>
	{/if}
</tr>
