<script>
	export let data;
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase"
		>{data.externalExams.length} zusätzliche Prüfungen anderer FKs (insbesondere MUC.DAI)</span
	>
</div>

<div class="overflow-x-auto my-2">
	<table class="table table-compact w-full">
		<thead>
			<tr>
				<th>Studiengang</th>
				<th>AnCode</th>
				<th>Module</th>
				<th>Prüfer:in</th>
				<th>Dauer</th>
			</tr>
		</thead>
		<tbody>
			{#each data.externalExams as exam}
				<tr>
					<td>{exam.program}</td>
					<td>{exam.ancode}</td>
					<td>{exam.module}</td>
					<td>{exam.mainExamer}</td>
					<td>{exam.duration} Min.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
