<script>
	import { onMount } from 'svelte';
	import ExamsZpaTableUnknown from '$lib/zpa/ExamsZpaTableUnknown.svelte';

	let zpaExamsStatusUnknown = [];
	async function getZpaExamsToPlan() {
		const response = await fetch('/api/zpaexams/planingStatusUnknown', {
			method: 'GET'
		});

		zpaExamsStatusUnknown = await response.json();
	}

	onMount(() => {
		getZpaExamsToPlan();
	});
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase"
		>{zpaExamsStatusUnknown.length} Prüfungen aus dem ZPA sind nicht zugeordnet</span
	>
</div>

<ExamsZpaTableUnknown exams={zpaExamsStatusUnknown} />
