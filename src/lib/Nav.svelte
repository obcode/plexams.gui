<script>
	import { request, gql } from 'graphql-request';
	import { semester, allSemesterNames } from '../stores/semester.js';
	import { fetchZPA } from '../stores/zpa.js';
	import { isOverlayOpen } from '../stores/overlay';
	import Overlay from '$lib/Overlay.svelte';

	function setSemester(sem) {
		const mutation = gql`
            mutation {
                setSemester(input: "${sem}") {
                    id
                }
            }
        `;

		request('http://localhost:8080/query', mutation).then((data) => {
			console.log(`set semester to ${data}`);
			semester.set(data.setSemester.id);
			fetchZPA();
			isOverlayOpen.set(false);
		});
	}
</script>

{#if $isOverlayOpen}
	<Overlay>
		<div class="text-center">
			<h1>Semester auswählen:</h1>
			{#each $allSemesterNames as semesterName}
				<button
					class="bg-green-200 text-black font-bold py-2 px-4 m-4 rounded hover:bg-green-500"
					on:click={setSemester(semesterName)}
				>
					{semesterName}
				</button>
			{/each}
		</div>
	</Overlay>
{/if}

<nav class="flex justify-center w-full">
	<a class="mx-4 text-lg" href="/">Plexams</a>
	<a class="mx-4 text-lg" href="/zpa/teacher">Dozierende</a>
	<a class="mx-4 text-lg" href="/zpa/invigilators">Aufsichten</a>
	<a class="mx-4 text-lg" href="/zpa/exams">Prüfungsliste (ZPA)</a>
	<a class="mx-4 text-lg" href="/primuss">Prüfungsliste (Primuss)</a>
	<button
		class="mr-4 text-lg bg-gray-300 px-4 rounded-lg"
		on:click={() => {
			isOverlayOpen.set(true);
		}}>{$semester}</button
	>
</nav>
