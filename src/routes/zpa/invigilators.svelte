<script>
	import { invigilators } from '../../stores/zpa.js';
	import Teachers from '$lib/Teachers.svelte';

	let searchTerm = '';
	let filteredTeacher = [];

	$: {
		if (searchTerm) {
			filteredTeacher = $invigilators.filter((teacher) =>
				teacher.fullname.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			filteredTeacher = [...$invigilators];
		}
	}
</script>

<div class="text-center">
	<h1 class="inline-flex relative text-4xl my-8 uppercase">
		Aufsichten
		<div
			class="inline-flex absolute -top-6 -right-6 justify-center items-center w-8 h-8 text-sm font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
		>
			{$invigilators.length}
		</div>
	</h1>
</div>

<input
	class="w-full rounded-md text-lg p-4 border-2 border-gray-900"
	type="text"
	bind:value={searchTerm}
	placeholder="Suche Aufsichten"
/>

<Teachers teachers={filteredTeacher} />
