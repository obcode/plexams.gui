<script>
	export let data;
	import TeacherWithNTACard from '$lib/nta/TeacherWithNTACard.svelte';
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		{data.ntasWithRegsByTeacher.length} betroffene Prüfer:innen
	</div>
</div>

<div class="grid grid-cols-3 gap-3">
	{#each data.ntasWithRegsByTeacher as teacherWithNTA}
		<TeacherWithNTACard {teacherWithNTA} />
	{/each}
</div>
