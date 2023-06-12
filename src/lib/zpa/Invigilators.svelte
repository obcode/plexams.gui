<script>
	export let invigilators;
	import TeacherCard from '$lib/zpa/TeacherCard.svelte';
	function bg(hasReqs) {
		if (hasReqs) {
			return 'border-green-500';
		}
		return 'border-red-500';
	}
</script>

<div class="py-4 grid gap-4 md:grid-cols-6 grid-cols-2">
	{#each invigilators as invigilator}
		<div class="border-2 {bg(invigilator.hasSubmittedRequirements)}">
			<TeacherCard teacher={invigilator.teacher} />
		</div>
	{/each}
</div>
