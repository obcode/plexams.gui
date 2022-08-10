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

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Dozierende</div>
</div>

<div class="flex">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTerm}
		placeholder="Suche Dozierende"
	/>
</div>

<Teachers teachers={filteredTeacher} />
