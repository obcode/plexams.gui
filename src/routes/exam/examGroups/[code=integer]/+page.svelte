<script>
	export let data;
	import ExamGroupCard from '$lib/ExamGroupCard.svelte';
	import ExamGroupConflictCard from '$lib/ExamGroupConflictCard.svelte';
</script>

<div class="grid md:grid-cols-1 lg:grid-cols-2  2xl:grid-cols-3 gap-1">
	<ExamGroupCard group={data.group} />
	<container>
		{#each data.conflicts as conflict}
			<ExamGroupConflictCard group={conflict.group} count={conflict.count} />
		{/each}
	</container>
</div>
