<script>
	export let data;
	import ExamGroupCard from '$lib/ExamGroupCard.svelte';

	// let groups = data.examGroups;
	let groups = data.examGroups.sort((a, b) => {
		return b.examGroupInfo.studentRegs - a.examGroupInfo.studentRegs;
	});
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">{data.examGroups.length} Prüfungsgruppen</span>
</div>

{#each groups as group}
	<ExamGroupCard {group} />
{/each}
