<script>
	import { onMount } from 'svelte';
	import ExamsZpaTable from '../../../lib/ExamsZpaTable.svelte';

	let zpaExamsNotToPlan = [];
	async function getZpaExamsNotToPlan() {
		const response = await fetch('/api/zpaexams/nottoplan', {
			method: 'GET'
		});

		zpaExamsNotToPlan = await response.json();
	}

	onMount(() => {
		getZpaExamsNotToPlan();
	});
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase"
		>{zpaExamsNotToPlan.length} Prüfungen aus dem ZPA sind nicht zu planen</span
	>
</div>

<ExamsZpaTable exams={zpaExamsNotToPlan} inPlan={false} />
