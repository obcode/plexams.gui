<script>
	import { onMount } from 'svelte';
	import { workflow, fetchWorkflow, initWorkflow } from '../stores/workflow';
	import { semester } from '../stores/semester.js';
	import Step from '$lib/Step.svelte';

	onMount(() => {
		fetchWorkflow();
	});

	function init() {
		initWorkflow();
		location.reload();
	}
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Prüfungsplanung im {$semester}</div>
</div>

<div class="flex justify-center mt-20">
	{#if $workflow && $workflow.length > 0}
		<ul class="steps steps-vertical">
			{#each $workflow as step}
				<Step {step} />
			{/each}
		</ul>
	{:else}
		<div class="p-8">
			<button class="btn" on:click={init}>Initialisiere Standard-Workflow</button>
		</div>
	{/if}
</div>
