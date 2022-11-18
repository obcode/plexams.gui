<script>
	export let data;
	import ExamGroupCard from '$lib/ExamGroupCard.svelte';
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">{data.examGroups.length} Prüfungsgruppen</span>
</div>

{#each data.examGroups as group}
	<ExamGroupCard {group} />
{/each}
