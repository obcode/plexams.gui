<script>
	export let data;
	import Step from '$lib/Step.svelte';

	let highestDone = 0;

	let workflow;

	if (data.workflow && data.workflow.length > 0) {
		for (let i = 0; i < data.workflow.length; i++) {
			const step = data.workflow[i];
			if (highestDone == step.number - 1 && step.done) {
				highestDone = step.number;
			}
		}
	}
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Prüfungsplanung im {data.semester}</div>
</div>

<div class="flex justify-center mt-20">
	{#if data.workflow && data.workflow.length > 0}
		<ul class="steps steps-vertical">
			{#each data.workflow as step}
				<Step {step} />
			{/each}
		</ul>
	{/if}
</div>

<div class="toast">
	<div class="alert">
		<div>
			<span
				>Der Workflow wird in der Konfigurationsdatei <code
					>{data.semester.replace(' ', '')}/plexams.yaml</code
				> bearbeitet.</span
			>
		</div>
	</div>
</div>
