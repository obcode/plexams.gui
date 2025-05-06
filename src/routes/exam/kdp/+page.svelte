<script>
	export let data;
	// import { onMount } from 'svelte';

	let exams = data.zpaExamsToPlanWithConstraints.filter(
		(exam) =>
			exam.constraints &&
			exam.constraints.roomConstraints &&
			(exam.constraints.roomConstraints.exahm || exam.constraints.roomConstraints.seb)
	);

	// let zpaExamsToPlanWithConstraints = [];
	// async function getZpaExamsToPlan() {
	// 	const response = await fetch('/api/examswithconstraints', {
	// 		method: 'GET'
	// 	});

	// 	zpaExamsToPlanWithConstraints = await response.json();
	// }

	// onMount(() => {
	// 	getZpaExamsToPlan();
	// });
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">{exams.length} Prüfungen mit EXaHM oder SEB</span>
</div>

<table class="table-auto border-collapse border border-gray-400 w-full text-left">
	<thead>
		<tr>
			<th class="border border-gray-400 px-4 py-2">Ancode</th>
			<th class="border border-gray-400 px-4 py-2">Modulname</th>
			<th class="border border-gray-400 px-4 py-2">Prüfender</th>
			<th class="border border-gray-400 px-4 py-2">EXaHM/SEB</th>
			<th class="border border-gray-400 px-4 py-2">DA</th>
			<th class="border border-gray-400 px-4 py-2">DC</th>
			<th class="border border-gray-400 px-4 py-2">IB</th>
			<th class="border border-gray-400 px-4 py-2">IC</th>
			<th class="border border-gray-400 px-4 py-2">IF</th>
			<th class="border border-gray-400 px-4 py-2">IG</th>
			<th class="border border-gray-400 px-4 py-2">IN</th>
			<th class="border border-gray-400 px-4 py-2">IS</th>
			<th class="border border-gray-400 px-4 py-2">IT</th>
			<th class="border border-gray-400 px-4 py-2">WD</th>
			<th class="border border-gray-400 px-4 py-2">WT</th>
			<th class="border border-gray-400 px-4 py-2">GN</th>
			<th class="border border-gray-400 px-4 py-2">DE</th>
			<th class="border border-gray-400 px-4 py-2">GS</th>
			<th class="border border-gray-400 px-4 py-2">ID</th>
			<th class="border border-gray-400 px-4 py-2">Gruppen</th>
		</tr>
	</thead>
	<tbody>
		{#each exams as exam}
			<tr>
				<td class="border border-gray-400 px-4 py-2">{exam.zpaExam.ancode}</td>
				<td class="border border-gray-400 px-4 py-2">{exam.zpaExam.module}</td>
				<td class="border border-gray-400 px-4 py-2">{exam.zpaExam.mainExamer}</td>
				<td class="border border-gray-400 px-4 py-2">
					{exam.constraints.roomConstraints.exahm ? 'EXaHM' : 'SEB'}
				</td>
				{#each ['DA', 'DC', 'IB', 'IC', 'IF', 'IG', 'IN', 'IS', 'IT', 'WD', 'WT', 'GN', 'DE', 'GS', 'ID'] as program}
					<td
						class="border border-gray-400 px-4 py-2"
						style="background-color: {exam.zpaExam.primussAncodes.some(
							(ancode) => ancode.program === program
						)
							? 'red'
							: 'transparent'}"
					>
					</td>
				{/each}
				<td class="border border-gray-400 px-4 py-2">{exam.zpaExam.groups.join(', ')}</td>
			</tr>
		{/each}
	</tbody>
</table>
