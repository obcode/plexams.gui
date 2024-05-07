<script>
	export let data;

	let programs = data.mucdaiExams.map((exam) => exam.program);
	programs = programs.filter((value, index) => programs.indexOf(value) === index);

	console.log(programs);

	let program = programs.length > 0 ? programs[0] : '';

	let exams = [];

	$: exams = data.mucdaiExams.filter((p) => p.program == program);

	function bg(plannedBy) {
		if (plannedBy !== 'FK07') {
			return 'text-gray-400';
		}
	}
</script>

<h1 class="text-4xl text-center my-8 uppercase">Prüfungslisten aus Primuss</h1>

<div class="grid grid-cols-1 justify-items-center">
	<div class="btn-group">
		{#each programs as p}
			<input
				type="radio"
				name="options"
				data-title={p}
				bind:group={program}
				value={p}
				class="btn"
			/>
		{/each}
	</div>

	<div class="overflow-x-auto my-6">
		<table class="table table-compact">
			<thead>
				<tr>
					<th>AnCode</th>
					<th>Module</th>
					<th>Prüfender</th>
					<th>Art</th>
					<th>Dauer</th>
					<th>Wiederholungsprüfung</th>
					<th>Planung durch</th>
				</tr>
			</thead>
			<tbody>
				{#if exams.length > 0}
					{#each exams as exam}
						<tr>
							<td class={bg(exam.plannedBy)}>{exam.primussAncode}</td>
							<td class={bg(exam.plannedBy)}>{exam.module}</td>
							<td class={bg(exam.plannedBy)}>{exam.mainExamer}</td>
							<td class={bg(exam.plannedBy)}>{exam.examType}</td>
							<td class={bg(exam.plannedBy)}>{exam.duration} Min.</td>
							<td class={bg(exam.plannedBy)}>
								{#if exam.isRepeaterExam}X{/if}
							</td>
							<td class={bg(exam.plannedBy)}>{exam.plannedBy}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
