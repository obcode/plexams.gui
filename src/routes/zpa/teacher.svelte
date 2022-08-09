<script>
	import { teachers } from '../../stores/zpa.js';
	import Teachers from '$lib/Teachers.svelte';

	let searchTerm = '';
	let filteredTeacher = [];

	$: {
		if (searchTerm) {
			filteredTeacher = $teachers.filter((teacher) =>
				teacher.fullname.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			filteredTeacher = [...$teachers];
		}
	}
</script>

<h1 class="text-4xl text-center my-8 uppercase">Dozierende</h1>

<input
	class="w-full rounded-md text-lg p-4 border-2 border-gray-900"
	type="text"
	bind:value={searchTerm}
	placeholder="Suche Dozierende"
/>

<Teachers teachers={filteredTeacher} />
