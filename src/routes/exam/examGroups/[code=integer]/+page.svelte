<script>
	export let data;
	import ExamGroupCard from '$lib/examGroups/ExamGroupCard.svelte';
	import ExamGroupConflictCard from '$lib/examGroups/ExamGroupConflictCard.svelte';
</script>

<div class="grid grid-cols-2 gap-1">
	<ExamGroupCard group={data.group} />
	<container>
		{#each data.conflicts as conflict}
			<ExamGroupConflictCard group={conflict.group} count={conflict.count} />
		{/each}
	</container>
</div>
