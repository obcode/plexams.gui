<script>
	export let teachers;
	import TeacherCard from '$lib/TeacherCard.svelte';
</script>

<div class="py-4 grid gap-4 md:grid-cols-6 grid-cols-2">
	{#each teachers as teacher}
		<TeacherCard {teacher} />
	{/each}
</div>
