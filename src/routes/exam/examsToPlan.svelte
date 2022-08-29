<script>
	import { onMount } from 'svelte';
	import ExamsZpaTable from '../../lib/ExamsZpaTable.svelte';
	import { zpaExamsToPlan, fetchZPAExamsToPlan } from '../../stores/zpa';

	onMount(() => {
		fetchZPAExamsToPlan();
	});
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">{$zpaExamsToPlan.length} Prüfungen aus dem ZPA sind zu planen</span>
</div>

<ExamsZpaTable exams={$zpaExamsToPlan} />
