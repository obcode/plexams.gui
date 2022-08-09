<script>
	export let teacher;
	import { fade } from 'svelte/transition';
</script>

<h2
	class="p-6 bg-gray-100 text-gray-800 text-center rounded-md
	 shadow-sm hover:shadow-md hover:bg-green-200 flex flex-col items-center"
	transition:fade
>
	{teacher.id}.
	<br />
	{teacher.fullname}
</h2>
