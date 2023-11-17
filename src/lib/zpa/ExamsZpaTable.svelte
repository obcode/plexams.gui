<script>
	export let exams;
	export let inPlan;

	let searchTermAncode = '';
	let searchTermTeachers = '';
	let searchTermModule = '';
	let searchTermType = '';
	let searchTermGroups = '';
	let filteredExams = [];

	$: {
		if (searchTermAncode) {
			filteredExams = exams.filter((exam) => exam.ancode.toString().startsWith(searchTermAncode));
		} else if (searchTermTeachers) {
			filteredExams = exams.filter((exam) =>
				exam.mainExamer.toLowerCase().includes(searchTermTeachers.toLowerCase())
			);
		} else if (searchTermModule) {
			filteredExams = exams.filter((exam) =>
				exam.module.toLowerCase().includes(searchTermModule.toLowerCase())
			);
		} else if (searchTermType) {
			filteredExams = exams.filter((exam) =>
				exam.examTypeFull.toLowerCase().includes(searchTermType.toLowerCase())
			);
		} else if (searchTermGroups) {
			filteredExams = exams.filter((exam) => {
				for (let group of exam.groups) {
					if (group.toLowerCase().startsWith(searchTermGroups.toLowerCase())) {
						return true;
					}
				}
				return false;
			});
		} else {
			filteredExams = [...exams];
		}
	}

	async function addExam(ancode) {
		console.log(`${ancode} wird hinzugefügt.`);
		await fetch('/api/zpaexams/addToPlan', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		location.reload();
	}
	async function rmExam(ancode) {
		console.log(`${ancode} wird entfernt.`);
		await fetch('/api/zpaexams/rmFromPlan', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		location.reload();
	}
</script>

<div class="flex">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermAncode}
		placeholder="AnCode"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermModule}
		placeholder="Modulname"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermTeachers}
		placeholder="Dozierender"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermType}
		placeholder="Art"
	/>
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTermGroups}
		placeholder="Gruppe"
	/>
</div>

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
				<th>Primuss-Codes</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredExams as exam}
				<tr>
					<td>
						{#if inPlan}
							<input type="checkbox" class="toggle" checked on:click={() => rmExam(exam.ancode)} />
						{:else}
							<input type="checkbox" class="toggle" on:click={() => addExam(exam.ancode)} />
						{/if}
					</td>
					<td><a href="/exam/examWithRegs/{exam.ancode}">{exam.ancode}</a></td>
					<td>{exam.module}</td>
					<td>{exam.mainExamer}</td>
					<td>{exam.examTypeFull}</td>
					<td>{exam.groups}</td>
					<td>
						{#each exam.primussAncodes as ancode}
							{#if ancode.ancode == -1 || ancode.ancode == 0}
								<div class="badge badge-error m-1">{ancode.program}/{ancode.ancode}</div>
							{:else if ancode.ancode == exam.ancode}
								<div class="badge m-1">{ancode.program}/{ancode.ancode}</div>
							{:else}
								<div class="badge badge-warning m-1">{ancode.program}/{ancode.ancode}</div>
							{/if}
						{/each}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
