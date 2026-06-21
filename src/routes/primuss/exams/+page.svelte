<script>
	export let data;

	let program = data.primussExams.length > 0 ? data.primussExams[0].program : '';

	$: exams = data.primussExams.filter((/** @type {any} */ p) => p.program == program);
	$: rows = exams.length > 0 ? exams[0].exams : [];
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Prüfungslisten aus Primuss</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.primussExams.length}</span>
		<span class="text-sm text-base-content/60">Studiengänge</span>
	</div>

	<!-- Studiengang-Auswahl -->
	<div class="join flex-wrap">
		{#each data.primussExams as primussExam}
			<input
				type="radio"
				name="program"
				aria-label="{primussExam.program} ({primussExam.exams.length})"
				bind:group={program}
				value={primussExam.program}
				class="btn btn-sm join-item"
			/>
		{/each}
	</div>

	<div class="overflow-x-auto rounded-lg border border-base-300">
		<table class="table table-zebra table-sm">
			<thead>
				<tr>
					<th>AnCode</th>
					<th>Modul</th>
					<th>Prüfer:in</th>
					<th>Art</th>
					<th class="text-right">Anmeldungen</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as exam}
					<tr class={exam.studentRegsCount == 0 ? 'text-base-content/40' : ''}>
						<td class="tabular-nums">{exam.ancode}</td>
						<td>{exam.module}</td>
						<td>{exam.mainExamer}</td>
						<td>{exam.examType}</td>
						<td class="text-right">
							{#if exam.studentRegsCount == 0}
								<span class="badge badge-ghost badge-sm">0</span>
							{:else}
								<span class="tabular-nums">{exam.studentRegsCount}</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
