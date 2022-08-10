<script>
	import { request, gql } from 'graphql-request';
	import { semester, allSemesterNames } from '../stores/semester.js';
	import { fetchZPA } from '../stores/zpa.js';

	let dropdownOpen = false;

	function setSemester(sem) {
		const mutation = gql`
            mutation {
                setSemester(input: "${sem}") {
                    id
                }
            }
        `;

		request('http://localhost:8080/query', mutation).then((data) => {
			semester.set(data.setSemester.id);
			dropdownOpen = false;
		});
	}
</script>

<nav class="flex justify-center w-full">
	<a class="mx-4 text-lg" href="/">Plexams</a>
	<a class="mx-4 text-lg" href="/zpa/teacher">Dozierende</a>
	<a class="mx-4 text-lg" href="/zpa/invigilators">Aufsichten</a>
	<a class="mx-4 text-lg" href="/zpa/exams">Prüfungsliste (ZPA)</a>
	<a class="mx-4 text-lg" href="/primuss">Prüfungsliste (Primuss)</a>
	<div class="relative">
		<button
			class="mx-4 text-lg bg-blue-600 text-white rounded-md px-2 flex focus:outline-none focus:shadow-solid"
			on:click={() => {
				dropdownOpen = !dropdownOpen;
			}}
			>{$semester}
			<svg
				class="w-4 h-6 ml-2"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 9l-7 7-7-7"
				/></svg
			></button
		>
		{#if dropdownOpen}
			<div
				class="absolute mx-4  bg-white text-lg z-50 list-none divide-y divide-gray-100 rounded shadow my-4"
			>
				<ul>
					{#each $allSemesterNames as semesterName}
						<li
							class="block px-4 py-2 hover:bg-green-500 hover:text-green-100"
							on:click={setSemester(semesterName)}
						>
							{semesterName}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</nav>
