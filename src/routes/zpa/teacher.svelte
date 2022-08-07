<script context="module">
	import { request, gql } from 'graphql-request';

	const query = gql`
		query {
			teachers(fromZPA: false) {
				fullname
				shortname
				isProf
				isLBA
				isProfHC
				isStaff
				lastSemester
				fk
				id
				email
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
	export let data;
</script>

<h1>Dozenten</h1>

<ul>
	{#each data.teachers as teacher}
		<li>{teacher.id}. {teacher.fullname}</li>
	{/each}
</ul>
