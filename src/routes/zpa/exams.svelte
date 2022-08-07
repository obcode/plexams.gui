<script context="module">
	import { request, gql } from 'graphql-request';

	const query = gql`
		query {
			zpaexamsByType {
				type
				exams {
					semester
					anCode
					module
					mainExamer
					mainExamerID
					examType
					duration
					isRepeaterExam
					groups
				}
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

<h1>Prüfungsliste aus dem ZPA</h1>

<ul>
	{#each data.zpaexamsByType as zpaexamsType}
		<li>
			{zpaexamsType.type} ({zpaexamsType.exams.length})
			<ul>
				{#each zpaexamsType.exams as zpaexam}
					<li>
						{zpaexam.anCode}.
						{zpaexam.module},
						<i>{zpaexam.mainExamer}</i>
					</li>
				{/each}
			</ul>
		</li>
	{:else}
		<h3>keine Prüfungen im ZPA gefunden</h3>
	{/each}
</ul>
