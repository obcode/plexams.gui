<script>
	export let data;
	import ExamGroupCard from '$lib/examGroups/ExamGroupCard.svelte';

	// let groups = data.examGroups;
	let groups = data.examGroups.sort((a, b) => {
		return b.examGroupInfo.studentRegs - a.examGroupInfo.studentRegs;
	});
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">{data.examGroups.length} Prüfungsgruppen</span>
</div>

<div class="grid md:grid-cols-1 lg:grid-cols-2  2xl:grid-cols-3 gap-1">
	{#each groups as group}
		<ExamGroupCard {group} />
	{/each}
</div>
