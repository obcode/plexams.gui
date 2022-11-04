<script>
	import { onMount } from 'svelte';
	import ExamsZpaTable from '../../../lib/ExamsZpaTable.svelte';

	let zpaExamsToPlan = [];
	async function getZpaExamsToPlan() {
		const response = await fetch('/api/zpaexams/toplan', {
			method: 'GET'
		});

		zpaExamsToPlan = await response.json();
	}

	onMount(() => {
		getZpaExamsToPlan();
	});
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">{zpaExamsToPlan.length} Prüfungen aus dem ZPA sind zu planen</span>
</div>

<ExamsZpaTable exams={zpaExamsToPlan} inPlan={true} />
