<script>
	export let data;
	// import { onMount } from 'svelte';
	import ConstraintsTable from '../../../lib/ConstraintsTable.svelte';

	// let zpaExamsToPlanWithConstraints = [];
	// async function getZpaExamsToPlan() {
	// 	const response = await fetch('/api/examswithconstraints', {
	// 		method: 'GET'
	// 	});

	// 	zpaExamsToPlanWithConstraints = await response.json();
	// }

	// onMount(() => {
	// 	getZpaExamsToPlan();
	// });
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase"
		>{data.zpaExamsToPlanWithConstraints.filter((exam) => exam.constraints).length} ZPA-Prüfungen mit
		Constraints</span
	>
</div>

<ConstraintsTable examsWithConstraints={data.zpaExamsToPlanWithConstraints} />
