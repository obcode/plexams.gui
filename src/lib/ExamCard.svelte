<script>
	export let exam;
	import { fade } from 'svelte/transition';
</script>

<h2
	class="p-6 bg-gray-100 text-gray-800 text-center rounded-md
	 shadow-sm hover:shadow-md hover:bg-green-200 flex flex-col items-center"
	transition:fade
>
	<span class="text-red-500">
		{exam.anCode}.
	</span>
	{exam.module}
	<span class="text-blue-500">
		{exam.mainExamer}
	</span>
</h2>
