<script>
	export let data;

	import { onMount } from 'svelte';
	import { workflow, fetchWorkflow } from '../stores/workflow';
	import { semester } from '../stores/semester.js';
	import Step from '$lib/Step.svelte';

	onMount(() => {
		fetchWorkflow();
	});
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Prüfungsplanung im {data.semester}</div>
</div>

<div class="flex justify-center mt-20">
	{#if $workflow && $workflow.length > 0}
		<ul class="steps steps-vertical">
			{#each $workflow as step}
				<Step {step} />
			{/each}
		</ul>
	{/if}
</div>

<div class="toast">
	<div class="alert">
		<div>
			<span>Der Workflow wird in der Konfigurationsdatei <code>plexams.yaml</code> bearbeitet.</span
			>
		</div>
	</div>
</div>
