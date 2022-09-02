<script>
	export let step;
	var status;
	$: if (step.done) {
		status = 'step-success';
	} else {
		status = 'step-primary';
	}
</script>

<li data-content={step.number} class="step {status}">
	{step.name}
</li>
