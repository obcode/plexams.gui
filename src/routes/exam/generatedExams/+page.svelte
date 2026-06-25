<script>
	export let data;
	import GeneratedExamsTable from '$lib/exam/GeneratedExamsTable.svelte';
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Generierte Prüfungen</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.plannedExams.length}</span>
		<span class="text-sm text-base-content/50">mit Anmeldungen</span>
	</div>

	<GeneratedExamsTable exams={data.plannedExams} />
</div>
