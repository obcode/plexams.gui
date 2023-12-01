<script>
	export let data;
	import GeneratedExamsTable from '$lib/exam/GeneratedExamsTable.svelte';
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">{data.plannedExams.length} Prüfungen mit Anmeldungen</span>
</div>

<GeneratedExamsTable exams={data.plannedExams} />
