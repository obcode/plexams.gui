<script>
	export let data;
	import ExamsWithRegsTable from '$lib/ExamsWithRegsTable.svelte';
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">{data.examsWithRegs.length} Prüfungen mit Anmeldungen</span>
</div>

<ExamsWithRegsTable exams={data.examsWithRegs} />
