<script>
	export let step;
	import { mkDate } from '$lib/jshelper/misc';
	var status;
	$: if (step.done) {
		status = 'step-success';
	} else {
		status = 'step-primary';
	}

	let date;

	if (step.deadline) {
		date = mkDate(step.deadline);
	}
</script>

<li data-content={step.number} class="step {status}">
	{step.name}
	{#if step.deadline}
		(Deadline: {date})
	{/if}
</li>
