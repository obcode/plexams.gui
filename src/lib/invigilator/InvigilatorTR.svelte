<script>
	export let index;
	export let invigilator;

	import InvigilatorDays from './InvigilatorDays.svelte';

	console.log(invigilator);

	function bg(invigilator) {
		if (!invigilator.requirements) {
			return 'bg-red-400';
		}
	}

	let contribution = 0;
	if (invigilator.requirements) {
		contribution =
			invigilator.requirements.oralExamsContribution +
			invigilator.requirements.liveCodingContribution +
			invigilator.requirements.masterContribution;
	}
</script>

<tr>
	<td>{index + 1}</td>
	<td class={bg(invigilator)}>{invigilator.teacher.shortname} ({invigilator.teacher.id})</td>
	<td
		>{#if invigilator.requirements.partTime != 1}
			Teilzeit {invigilator.requirements.partTime}{/if}
		{#if invigilator.requirements.freeSemester != 0}
			Freisemester {invigilator.requirements
				.freeSemester}{/if}{#if invigilator.requirements.overtimeLastSemester != 0}
			letztes Semester {invigilator.requirements.overtimeLastSemester}{/if}
		{#if invigilator.requirements.overtimeThisSemester != 0}
			dieses Semester {invigilator.requirements.overtimeThisSemester}{/if}</td
	>
	<td
		>{#if contribution > 0}{contribution} Minuten{/if}</td
	>
	<td><InvigilatorDays requirements={invigilator.requirements} /></td>
</tr>
