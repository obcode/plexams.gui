<script>
	import { onMount } from 'svelte';
	import ExamsZpaTable from '../../../lib/ExamsZpaTable.svelte';
	import { zpaExamsNotToPlan, fetchZPAExamsNotToPlan } from '../../../stores/zpa';

	onMount(() => {
		fetchZPAExamsNotToPlan();
	});
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase"
		>{$zpaExamsNotToPlan.length} Prüfungen aus dem ZPA sind nicht zu planen</span
	>
</div>

<ExamsZpaTable exams={$zpaExamsNotToPlan} inPlan={false} />
