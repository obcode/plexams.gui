<script context="module">
	import { request, gql } from 'graphql-request';

	const query = gql`
		query {
			primussExams {
				program
				exams {
					anCode
					module
					mainExamer
					program
					examType
					presence
					studentRegs {
						name
					}
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

<h1>Prüfungsliste aus Primuss</h1>

<ul>
	{#each data.primussExams as primussExam}
		<li>
			{primussExam.program} ({primussExam.exams.length})
			<ul>
				{#each primussExam.exams as exam}
					<li>
						{exam.anCode}.
						{exam.module},
						<i>{exam.mainExamer}</i>
						({exam.studentRegs.length} Anmeldungen)
					</li>
				{/each}
			</ul>
		</li>
	{:else}
		<h3>keine Prüfungen von Primuss gefunden</h3>
	{/each}
</ul>
