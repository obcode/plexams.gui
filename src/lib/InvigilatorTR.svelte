<script>
	export let index;
	export let invigilator;

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
	<td class="text-right"
		>{#if contribution > 0}{contribution} Minuten{/if}</td
	>
</tr>
