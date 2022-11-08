<script>
	export let exams;

	async function addExam(anCode) {
		console.log(`${anCode} wird hinzugefügt.`);
		await fetch('/api/zpaexams/addToPlan', {
			method: 'POST',
			body: JSON.stringify({ anCode, unknown: true }),
			headers: {
				'content-type': 'application/json'
			}
		});
		location.reload();
	}
	async function rmExam(anCode) {
		console.log(`${anCode} wird entfernt.`);
		await fetch('/api/zpaexams/rmFromPlan', {
			method: 'POST',
			body: JSON.stringify({ anCode, unknown: true }),
			headers: {
				'content-type': 'application/json'
			}
		});
		location.reload();
	}
</script>

<div class="overflow-x-auto my-2">
	<table class="table table-compact w-full">
		<thead>
			<tr>
				<th />
				<th>AnCode</th>
				<th>Module</th>
				<th>Prüfer:in</th>
				<th>Art</th>
				<th>Gruppen</th>
				<th />
			</tr>
		</thead>
		<tbody>
			{#each exams as exam}
				<tr>
					<td>
						<button class="btn btn-success  btn-sm" on:click={() => addExam(exam.anCode)}
							>Planen</button
						>
					</td>
					<td>{exam.anCode}</td>
					<td>{exam.module}</td>
					<td>{exam.mainExamer}</td>
					<td>{exam.examTypeFull}</td>
					<td>{exam.groups}</td>
					<td>
						<button class="btn btn-error  btn-sm" on:click={() => rmExam(exam.anCode)}
							>Nicht planen</button
						>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
