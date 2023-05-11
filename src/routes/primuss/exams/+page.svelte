<script>
	export let data;

	let program = data.primussExams[0].program;

	let exams = [];

	$: exams = data.primussExams.filter((p) => p.program == program);

	function bg(count) {
		if (count == 0) {
			return 'text-gray-400';
		}
	}
</script>

<h1 class="text-4xl text-center my-8 uppercase">Prüfungsliste aus Primuss</h1>

<div class="grid grid-cols-1 justify-items-center">
	<div class="btn-group">
		{#each data.primussExams as primussExam}
			<input
				type="radio"
				name="options"
				data-title={primussExam.program}
				bind:group={program}
				value={primussExam.program}
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
					<th>Prüfer:in</th>
					<th>Art</th>
					<th>Anmeldungen</th>
					<th>Konflikte</th>
				</tr>
			</thead>
			<tbody>
				{#each exams[0].exams as exam}
					<tr>
						<td class={bg(exam.studentRegs.length)}>{exam.ancode}</td>
						<td class={bg(exam.studentRegs.length)}>{exam.module}</td>
						<td class={bg(exam.studentRegs.length)}>{exam.mainExamer}</td>
						<td class={bg(exam.studentRegs.length)}>{exam.examType}</td>
						<td class={bg(exam.studentRegs.length)}>{exam.studentRegs.length} Anmeldungen</td>
						<td class={bg(exam.studentRegs.length)}>{exam.conflicts.conflicts.length} Konflikte</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
