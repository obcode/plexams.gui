<script>
	export let exam;
	import { fade } from 'svelte/transition';
</script>

<div class="card bg-base-100 shadow-xl" transition:fade>
	<div class="card-body">
		<div class="flex justify-between">
			<span class="text-red-900">
				{exam.anCode}.
			</span>
			<span class="text-green-900">{exam.groups}</span>
		</div>
		{exam.module}
		<span class="text-blue-900">
			{exam.mainExamer}
		</span>
	</div>
</div>
