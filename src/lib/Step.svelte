<script>
	export let step;
	var status;
	$: if (step.done) {
		status = 'step-success';
	} else {
		status = 'step-primary';
	}
</script>

<li data-content={step.number} class="step {status}" on:click={() => (step.done = !step.done)}>
	{step.name}
</li>
