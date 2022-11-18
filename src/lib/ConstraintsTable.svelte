<script>
	export let examsWithConstraints;
	// export let inPlan;

	let searchTermAncode = '';
	let searchTermTeachers = '';
	let searchTermModule = '';
	let searchTermType = '';
	let searchTermGroups = '';
	let filteredExams = [];
	filteredExams = [...examsWithConstraints];
	let onlyConstraints = true;

	$: {
		if (onlyConstraints) {
			filteredExams = examsWithConstraints.filter((exam) => exam.constraints);
		} else {
			filteredExams = [...examsWithConstraints];
		}
	}

	// $: {
	// 	if (searchTermAncode) {
	// 		filteredExams = exams.filter((exam) => exam.ancode.toString().startsWith(searchTermAncode));
	// 	} else if (searchTermTeachers) {
	// 		filteredExams = exams.filter((exam) =>
	// 			exam.mainExamer.toLowerCase().includes(searchTermTeachers.toLowerCase())
	// 		);
	// 	} else if (searchTermModule) {
	// 		filteredExams = exams.filter((exam) =>
	// 			exam.module.toLowerCase().includes(searchTermModule.toLowerCase())
	// 		);
	// 	} else if (searchTermType) {
	// 		filteredExams = exams.filter((exam) =>
	// 			exam.examTypeFull.toLowerCase().includes(searchTermType.toLowerCase())
	// 		);
	// 	} else if (searchTermGroups) {
	// 		filteredExams = exams.filter((exam) => {
	// 			for (let group of exam.groups) {
	// 				if (group.toLowerCase().startsWith(searchTermGroups.toLowerCase())) {
	// 					return true;
	// 				}
	// 			}
	// 			return false;
	// 		});
	// 	} else {
	// 		filteredExams = [...exams];
	// 	}
	// }

	// async function addExam(ancode) {
	// 	console.log(`${ancode} wird hinzugefügt.`);
	// 	await fetch('/api/zpaexams/addToPlan', {
	// 		method: 'POST',
	// 		body: JSON.stringify({ ancode, unknown: false }),
	// 		headers: {
	// 			'content-type': 'application/json'
	// 		}
	// 	});
	// 	location.reload();
	// }
	async function notPlannedByMe(ancode) {
		await fetch('/api/notPlannedByMe', {
			method: 'POST',
			body: JSON.stringify({ ancode }),
			headers: {
				'content-type': 'application/json'
			}
		});
		// location.reload();
	}

	function bgConstraints(constraints) {
		if (constraints && constraints.notPlannedByMe) {
			return 'bg-red-400';
		}
		if (constraints) {
			return 'bg-yellow-200';
		}
		return ' ';
	}
</script>

<!-- <div class="flex ">
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
</div> -->
<div class="flex flex-col">
	<div class="form-control w-52">
		<div class="form-control">
			<label class="label cursor-pointer">
				<span class="label-text">Nur Constraints</span>
				<input
					type="checkbox"
					class="toggle"
					checked
					on:click={() => {
						onlyConstraints = !onlyConstraints;
					}}
				/>
			</label>
		</div>
	</div>
</div>
<div class="overflow-x-auto my-2">
	<table class="table table-compact w-full">
		<thead>
			<tr>
				<th>zu planen</th>
				<th>Gleichzeitig mit</th>
				<th>Nicht am</th>
				<th>Nur am</th>
				<th>Raum-Constraints</th>
				<th>AnCode</th>
				<th>Module</th>
				<th>Prüfer:in</th>
				<th>Art</th>
				<th>Gruppen</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredExams as exam}
				<tr>
					<td class={bgConstraints(exam.constraints)}>
						{#if exam.constraints && exam.constraints.notPlannedByMe}
							<input
								type="checkbox"
								class="toggle"
								on:click={() => console.log('selbst aus DB löschen!')}
							/>
						{:else}
							<input
								type="checkbox"
								class="toggle"
								checked
								on:click={() => notPlannedByMe(exam.zpaExam.ancode)}
							/>
						{/if}
					</td>
					<td class={bgConstraints(exam.constraints)}
						>{#if exam.constraints && exam.constraints.sameSlot}
							{#each exam.constraints.sameSlot as ancode, i}
								{ancode}{#if i < exam.constraints.sameSlot.length - 1}, {/if}
							{/each}
						{/if}</td
					>
					<td class={bgConstraints(exam.constraints)}
						>{#if exam.constraints && exam.constraints.excludeDays}
							<ul>
								{#each exam.constraints.excludeDays as day}
									<li>
										{new Date(day).toLocaleDateString('de-DE', {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</li>
								{/each}
							</ul>
						{/if}</td
					>
					<td class={bgConstraints(exam.constraints)}
						>{#if exam.constraints && exam.constraints.possibleDays}
							<ul>
								{#each exam.constraints.possibleDays as day}
									<li>
										{new Date(day).toLocaleDateString('de-DE', {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</li>
								{/each}
							</ul>
						{/if}</td
					>
					<td class={bgConstraints(exam.constraints)}
						>{#if exam.constraints && exam.constraints.roomConstraints}
							{#if exam.constraints.roomConstraints.placesWithSocket}
								Plätze mit Steckdosen,
							{/if}
							{#if exam.constraints.roomConstraints.lab}
								Labor,
							{/if}
							{#if exam.constraints.roomConstraints.exahmRooms}
								EXaHM-Räume,
							{/if}
						{/if}</td
					>
					<td class={bgConstraints(exam.constraints)}>{exam.zpaExam.ancode}</td>
					<td class={bgConstraints(exam.constraints)}>{exam.zpaExam.module}</td>
					<td class={bgConstraints(exam.constraints)}>{exam.zpaExam.mainExamer}</td>
					<td class={bgConstraints(exam.constraints)}>{exam.zpaExam.examType}</td>
					<td class={bgConstraints(exam.constraints)}>{exam.zpaExam.groups}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
