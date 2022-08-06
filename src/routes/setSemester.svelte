<script context="module">
	import { request, gql } from 'graphql-request';

	const query = gql`
		query {
			allSemesterNames {
				id
			}
		}
	`;

	export const load = async () => {
		const data = await request('http://localhost:8080/query', query);

		return {
			props: {
				data
			}
		};
	};
</script>

<script>
	import { goto } from '$app/navigation';
	import { semester } from '$lib/stores.js';
	export let data;

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
			goto('/');
		});
	}
</script>

<h1>Semester auswählen</h1>

{#each data.allSemesterNames as semesterName}
	<button on:click={setSemester(semesterName.id)}>
		{semesterName.id}
	</button>
	<br />
{/each}
