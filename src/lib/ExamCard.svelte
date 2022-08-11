<script>
	export let exam;
	import { fade } from 'svelte/transition';
</script>

<div class="card bg-neutral text-neutral-content" on:click={() => (show = true)} transition:fade>
	<div class="card-body">
		<div class="flex justify-between">
			<span class="text-red-900">
				{exam.anCode}.
			</span>
			{#if exam.groups}
				<span class="text-green-900">{exam.groups}</span>
			{:else}
				<span class="text-green-900">{exam.program}</span>
			{/if}
		</div>
		{exam.module}
		<span class="text-blue-900">
			{exam.mainExamer}
		</span>
	</div>
</div>
