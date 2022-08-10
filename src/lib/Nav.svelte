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

<div class="navbar bg-base-100">
	<div class="flex-1">
		<a class="btn btn-ghost normal-case text-xl" href="/">Plexams</a>
	</div>

	<div class="flex-none">
		<ul class="menu menu-horizontal p-0">
			<li><a href="/zpa/teacher">Dozierende</a></li>
			<li><a href="/zpa/invigilators">Aufsichten</a></li>
			<li><a href="/zpa/exams">Prüfungsliste (ZPA)</a></li>
			<li><a href="/primuss">Prüfungsliste (Primuss)</a></li>
			<li tabindex="0">
				<!-- svelte-ignore a11y-missing-attribute -->
				<a>
					{$semester}
					<svg
						class="fill-current"
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg
					>
				</a>
				<ul class="p-2 bg-base-100">
					{#each $allSemesterNames as semesterName}
						<li
							class="block px-4 py-2 hover:bg-green-500 hover:text-green-100"
							on:click={setSemester(semesterName)}
						>
							<!-- svelte-ignore a11y-missing-attribute -->
							<a>{semesterName}</a>
						</li>
					{/each}
				</ul>
			</li>
		</ul>
	</div>
</div>
